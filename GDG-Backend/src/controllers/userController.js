const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /api/me
 * Accessible by any authenticated user (student or admin).
 * Returns the currently authenticated user's details and profile.
 */
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      message: 'User profile retrieved successfully',
      user: {
        id: req.user.id,
        email: req.user.email,
        phone: req.user.phone || null,
        created_at: req.user.created_at,
      },
      profile: req.user.profile,
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching profile.',
    });
  }
};

/**
 * GET /api/admin/members
 * Accessible by Admins only.
 * Returns a list of all registered members (students and admins) in the club.
 */
const getAdminMembers = async (req, res) => {
  try {
    // Admins can view all club member profiles
    const { data: members, error } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, details, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        error: 'Failed to retrieve club members.',
        details: error.message,
      });
    }

    const studentCount = members.filter((m) => m.role === 'student').length;
    const adminCount = members.filter((m) => m.role === 'admin').length;

    return res.status(200).json({
      message: 'Admin member list retrieved successfully.',
      summary: {
        total_members: members.length,
        students: studentCount,
        admins: adminCount,
      },
      members,
    });
  } catch (error) {
    console.error('getAdminMembers error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching members.',
    });
  }
};

/**
 * GET /api/student/dashboard
 * Accessible by Students only.
 * Returns student dashboard data, club announcements, and enrolled events.
 */
const getStudentDashboard = async (req, res) => {
  try {
    const studentProfile = req.user.profile;

    return res.status(200).json({
      message: `Welcome to the student dashboard, ${studentProfile.full_name}!`,
      dashboard: {
        student_info: {
          id: studentProfile.id,
          name: studentProfile.full_name,
          email: studentProfile.email,
          role: studentProfile.role,
          member_since: studentProfile.created_at,
        },
        club_overview: {
          upcoming_events: [
            { id: 'evt-1', title: 'Web Development Workshop', date: '2026-09-10' },
            { id: 'evt-2', title: 'Hackathon Info Session', date: '2026-09-18' },
          ],
          announcements: [
            { id: 'ann-1', title: 'Welcome new club members!', date: '2026-08-15' },
          ],
        },
      },
    });
  } catch (error) {
    console.error('getStudentDashboard error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching student dashboard.',
    });
  }
};

/**
 * GET /api/admin/logs
 * Accessible by Admins only.
 * Returns paginated audit/activity logs with optional filters (user_id, action, date range).
 */
const getAdminActivityLogs = async (req, res) => {
  try {
    const {
      user_id,
      action,
      start_date,
      end_date,
      from,
      to,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('activity_logs')
      .select('*', { count: 'exact' });

    // Optional query filters
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (action) {
      query = query.eq('action', action);
    }

    const effectiveStartDate = start_date || from;
    if (effectiveStartDate) {
      query = query.gte('created_at', effectiveStartDate);
    }

    const effectiveEndDate = end_date || to;
    if (effectiveEndDate) {
      query = query.lte('created_at', effectiveEndDate);
    }

    // Newest logs first + Pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: logs, count, error } = await query;

    if (error) {
      console.error('getAdminActivityLogs error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve activity logs.',
      });
    }

    return res.status(200).json({
      message: 'Activity logs retrieved successfully.',
      total: count !== null && count !== undefined ? count : logs.length,
      page: pageNum,
      limit: limitNum,
      logs: logs || [],
    });
  } catch (error) {
    console.error('getAdminActivityLogs error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching activity logs.',
    });
  }
};

/**
 * GET /api/admin/logs/security-alerts
 * Accessible by Admins only.
 * Specifically returns flagged security alerts (lockouts, brute-force attempts, suspicious actions).
 */
const getSecurityAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const alertActions = [
      'suspicious_admin_login_activity',
      'suspicious_admin_signup_activity',
      'account_locked',
      'locked_login_attempt',
    ];

    let query = supabaseAdmin
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .in('action', alertActions)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: alerts, count, error } = await query;

    if (error) {
      console.error('getSecurityAlerts error:', error);
      return res.status(500).json({
        error: 'Failed to retrieve security alerts.',
      });
    }

    return res.status(200).json({
      message: 'Security alerts retrieved successfully.',
      total: count !== null && count !== undefined ? count : alerts.length,
      page: pageNum,
      limit: limitNum,
      alerts: alerts || [],
    });
  } catch (error) {
    console.error('getSecurityAlerts error:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching security alerts.',
    });
  }
};

module.exports = {
  getMe,
  getAdminMembers,
  getStudentDashboard,
  getAdminActivityLogs,
  getSecurityAlerts,
};
