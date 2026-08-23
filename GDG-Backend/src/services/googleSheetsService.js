const GoogleCalendarService = require('./googleCalendarService');
const { supabaseAdmin } = require('../config/supabase');

/**
 * Service to manage Google Sheets integration, synchronization, and formatting.
 */
class GoogleSheetsService {
  /**
   * Extract spreadsheetId from various URL formats.
   *
   * @param {string} urlOrId
   * @returns {string|null}
   */
  static extractSpreadsheetId(urlOrId) {
    if (!urlOrId || typeof urlOrId !== 'string') return null;
    const trimmed = urlOrId.trim();
    // Matches /spreadsheets/d/([a-zA-Z0-9-_]+)
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    // If raw ID passed directly
    if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  }

  /**
   * Find a valid Google access token for syncing the sheet.
   * Priority:
   * 1. Form creator's linked Google token
   * 2. Requesting user's linked Google token
   * 3. Any admin's linked Google token
   *
   * @param {string|null} createdByUserId
   * @param {string|null} requestingUserId
   * @returns {Promise<string|null>}
   */
  static async getSheetsAccessToken(createdByUserId, requestingUserId) {
    // 1. Try form creator
    if (createdByUserId) {
      const token = await GoogleCalendarService.getValidAccessToken(createdByUserId);
      if (token) return token;
    }

    // 2. Try requesting user
    if (requestingUserId && requestingUserId !== createdByUserId) {
      const token = await GoogleCalendarService.getValidAccessToken(requestingUserId);
      if (token) return token;
    }

    // 3. Fallback: Search any admin with an active Google token
    try {
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        for (const admin of admins) {
          const token = await GoogleCalendarService.getValidAccessToken(admin.id);
          if (token) return token;
        }
      }
    } catch (err) {
      console.warn('Could not inspect admin tokens for Google Sheets sync:', err.message);
    }

    return null;
  }

  /**
   * Sync all submissions for a given form to the linked Google Sheet.
   *
   * @param {object} params
   * @param {object} params.form - The form object
   * @param {Array<object>} params.submissions - List of submissions
   * @param {string|null} params.requestingUserId - The user triggering the sync
   * @returns {Promise<{ success: boolean, message: string, action_required?: string, rows_synced?: number }>}
   */
  static async syncSubmissionsToSheet({ form, submissions, requestingUserId }) {
    const sheetsUrl = form.schema?.sheets_url || form.sheets_url;
    const spreadsheetId = this.extractSpreadsheetId(sheetsUrl);

    if (!spreadsheetId) {
      return {
        success: false,
        message: 'No valid Google Sheets URL or ID configured for this form.',
      };
    }

    const accessToken = await this.getSheetsAccessToken(form.created_by, requestingUserId);
    if (!accessToken) {
      return {
        success: false,
        action_required: 'CONNECT_GOOGLE_SHEETS',
        message:
          'Google Sheets authorization not found. Please connect your Google account to enable live sheet sync.',
      };
    }

    // 1. Fetch spreadsheet metadata to get the actual first sheet title and sheetId
    let sheetTitle = 'Sheet1';
    let sheetId = 0;

    try {
      const metaRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (metaRes.ok) {
        const meta = await metaRes.json();
        if (meta.sheets && meta.sheets.length > 0 && meta.sheets[0].properties) {
          sheetTitle = meta.sheets[0].properties.title || 'Sheet1';
          sheetId = meta.sheets[0].properties.sheetId ?? 0;
        }
      } else if (metaRes.status === 401 || metaRes.status === 403) {
        return {
          success: false,
          action_required: 'CONNECT_GOOGLE_SHEETS',
          message:
            'Google Sheets authorization expired or insufficient permissions. Please reconnect your Google account.',
        };
      }
    } catch (metaErr) {
      console.warn('Could not fetch spreadsheet metadata:', metaErr.message);
    }

    // 2. Build Header Row and Data Rows
    const schemaFields = form.schema?.fields || [];
    const headerRow = [
      'Submission #',
      'Submitted At',
      'Attendance Status',
      ...schemaFields.map((f) => f.label || f.name),
    ];

    const dataRows = (submissions || []).map((sub, idx) => {
      const base = [
        `#${idx + 1}`,
        new Date(sub.submitted_at).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        sub.attended ? 'Attended' : 'Not Attended',
      ];

      const fieldVals = schemaFields.map((f) => {
        const val = sub.answers ? sub.answers[f.name || f.id] : '';
        if (val === null || val === undefined) return '';
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        return String(val);
      });

      return [...base, ...fieldVals];
    });

    const allValues = [headerRow, ...dataRows];

    // 3. Clear existing sheet contents in the first tab
    try {
      const encodedTitle = encodeURIComponent(sheetTitle);
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedTitle}!A1:Z5000:clear`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (clearErr) {
      console.warn('Could not clear sheet prior to sync:', clearErr.message);
    }

    // 4. Write All Values (Header + Data)
    const encodedTitle = encodeURIComponent(sheetTitle);
    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedTitle}!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${sheetTitle}!A1`,
          majorDimension: 'ROWS',
          values: allValues,
        }),
      }
    );

    if (!writeRes.ok) {
      const errText = await writeRes.text();
      console.error('Google Sheets write failed:', writeRes.status, errText);
      if (writeRes.status === 401 || writeRes.status === 403) {
        return {
          success: false,
          action_required: 'CONNECT_GOOGLE_SHEETS',
          message:
            'Google Sheets authorization expired or insufficient edit permissions. Please reconnect your Google account.',
        };
      }
      return {
        success: false,
        message: `Failed to write data to Google Sheet (${writeRes.status}). Verify spreadsheet edit permissions.`,
      };
    }

    // 5. Apply Visual Formatting: Bold Blue Header, Frozen Row, Auto-Resized Columns
    try {
      const numCols = headerRow.length;
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              // Header Row Style: Google Blue (#4285F4) background, Bold white text
              {
                repeatCell: {
                  range: {
                    sheetId: sheetId,
                    startRowIndex: 0,
                    endRowIndex: 1,
                    startColumnIndex: 0,
                    endColumnIndex: numCols,
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: { red: 0.2588, green: 0.5215, blue: 0.9568 },
                      textFormat: {
                        bold: true,
                        foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                        fontSize: 11,
                      },
                      horizontalAlignment: 'LEFT',
                    },
                  },
                  fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
                },
              },
              // Freeze top Header Row
              {
                updateSheetProperties: {
                  properties: {
                    sheetId: sheetId,
                    gridProperties: {
                      frozenRowCount: 1,
                    },
                  },
                  fields: 'gridProperties.frozenRowCount',
                },
              },
              // Auto-fit column widths for maximum readability
              {
                autoResizeDimensions: {
                  dimensions: {
                    sheetId: sheetId,
                    dimension: 'COLUMNS',
                    startIndex: 0,
                    endIndex: numCols,
                  },
                },
              },
            ],
          }),
        }
      );
    } catch (fmtErr) {
      console.warn('Could not apply Google Sheets visual formatting:', fmtErr.message);
    }

    return {
      success: true,
      message: `Google Sheet synced successfully (${dataRows.length} submissions).`,
      rows_synced: dataRows.length,
    };
  }
}

module.exports = GoogleSheetsService;
