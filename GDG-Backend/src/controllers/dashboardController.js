const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/dashboard
 * Authenticated: Get the current user's profile and dynamic dashboard details.
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, details, created_at')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        error: 'Dashboard profile not found.',
      });
    }

    return res.status(200).json({
      message: 'Dashboard retrieved successfully.',
      dashboard: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        created_at: profile.created_at,
        details: profile.details || {},
      },
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching dashboard.',
    });
  }
};

/**
 * PUT /api/dashboard
 * Authenticated: Update current user's own profile and JSONB details.
 *
 * CRITICAL SECURITY ENFORCEMENT:
 * Strips `role`, `email`, and `id` from req.body to prevent privilege escalation
 * and unauthorized identifier changes. Only `full_name` and `details` (JSONB) are updatable.
 */
const updateDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, details } = req.body;

    const updatePayload = {};

    if (full_name && typeof full_name === 'string' && full_name.trim()) {
      updatePayload.full_name = full_name.trim();
    }

    if (details && typeof details === 'object' && !Array.isArray(details)) {
      // Fetch latest existing details from database to merge cleanly
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('details')
        .eq('id', userId)
        .single();

      const currentDetails = existingProfile?.details || {};
      updatePayload.details = {
        ...currentDetails,
        ...details,
      };
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        error: 'No valid update fields provided. You may update full_name and details.',
      });
    }

    const { data: updatedProfile, error } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, email, full_name, role, details, created_at')
      .single();

    if (error || !updatedProfile) {
      return res.status(500).json({
        error: 'Failed to update dashboard profile.',
        details: error ? error.message : undefined,
      });
    }

    return res.status(200).json({
      message: 'Dashboard updated successfully.',
      dashboard: updatedProfile,
    });
  } catch (error) {
    console.error('updateDashboard error:', error);
    return res.status(500).json({
      error: 'Internal server error while updating dashboard.',
    });
  }
};

module.exports = {
  getDashboard,
  updateDashboard,
};
