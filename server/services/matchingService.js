import pool from '../config/database.js';

/**
 * Basic matching service - matches learners with teachers based on skill and availability
 */

export const findMatchingTeachers = async (skillId) => {
  try {
    // Get the skill request details
    const [skills] = await pool.execute(
      'SELECT * FROM skills WHERE id = ?',
      [skillId]
    );

    if (skills.length === 0) {
      return [];
    }

    const skillRequest = skills[0];

    // Find matching skills (teachers offering similar skills)
    let query = `
      SELECT s.*, u.email as teacher_email, u.full_name as teacher_name, u.user_type as teacher_type
      FROM skills s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active'
        AND s.id != ?
        AND (s.category = ? OR s.title LIKE ?)
        AND s.rate_per_hour <= ?
    `;

    const params = [
      skillId,
      skillRequest.category || '',
      `%${skillRequest.title}%`,
      skillRequest.rate_per_hour || 999999
    ];

    const [matches] = await pool.execute(query, params);

    return matches;
  } catch (error) {
    console.error('Matching error:', error);
    return [];
  }
};

export const findMatchingSkills = async (requestId) => {
  try {
    // Get the skill request details
    const [requests] = await pool.execute(
      'SELECT * FROM skills WHERE id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return [];
    }

    const request = requests[0];

    // Find matching active skills
    let query = `
      SELECT s.*, u.email as teacher_email, u.full_name as teacher_name, u.user_type as teacher_type
      FROM skills s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active'
        AND s.id != ?
        AND (s.category = ? OR s.title LIKE ?)
    `;

    const params = [
      requestId,
      request.category || '',
      `%${request.title}%`
    ];

    if (request.rate_per_hour) {
      query += ' AND s.rate_per_hour <= ?';
      params.push(request.rate_per_hour);
    }

    const [matches] = await pool.execute(query, params);

    return matches;
  } catch (error) {
    console.error('Matching error:', error);
    return [];
  }
};
