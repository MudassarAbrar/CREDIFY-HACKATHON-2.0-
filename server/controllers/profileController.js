import pool from '../config/database.js';

export const getProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Get user basic info
    const [users] = await pool.execute(
      'SELECT id, email, user_type, credit_balance, full_name, bio, avatar_url, rating, total_reviews, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get profile extensions
    const [profiles] = await pool.execute(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    // Get user stats (count active skills taught; type column may not exist in all migrations)
    const [skillsTaught] = await pool.execute(
      'SELECT COUNT(*) as count FROM skills WHERE user_id = ? AND status = "active"',
      [userId]
    );

    const [skillsLearned] = await pool.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE learner_id = ? AND status = "completed"',
      [userId]
    );

    // Get reviews
    const [reviews] = await pool.execute(
      'SELECT * FROM reviews WHERE reviewee_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      user: {
        ...user,
        profile: profiles[0] || null,
        stats: {
          skillsTaught: skillsTaught[0]?.count || 0,
          skillsLearned: skillsLearned[0]?.count || 0,
          totalReviews: user.total_reviews || 0,
          rating: parseFloat(user.rating || 0),
        },
        reviews: reviews || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (parseInt(userId) !== currentUserId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const {
      full_name,
      bio,
      user_type,
      linkedin_url,
      github_url,
      portfolio_url,
      location,
      timezone,
      institution,
      degree,
      graduation_year,
      company,
      job_title,
      years_experience,
      languages,
      availability_status,
      response_time_hours,
    } = req.body;

    // Update users table
    const userUpdates = [];
    const userValues = [];

    if (full_name !== undefined) {
      userUpdates.push('full_name = ?');
      userValues.push(full_name);
    }
    if (bio !== undefined) {
      userUpdates.push('bio = ?');
      userValues.push(bio);
    }
    if (user_type !== undefined && ['student', 'professional'].includes(user_type)) {
      userUpdates.push('user_type = ?');
      userValues.push(user_type);
    }

    if (userUpdates.length > 0) {
      userValues.push(userId);
      await pool.execute(
        `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
        userValues
      );
    }

    // Update or insert user_profiles
    const [existing] = await pool.execute(
      'SELECT id FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    const profileData = {
      linkedin_url,
      github_url,
      portfolio_url,
      location,
      timezone,
      institution,
      degree,
      graduation_year,
      company,
      job_title,
      years_experience,
      languages: languages ? JSON.stringify(languages) : null,
      availability_status,
      response_time_hours,
    };

    if (existing.length > 0) {
      const updates = [];
      const values = [];
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = ?`);
          values.push(value);
        }
      });
      if (updates.length > 0) {
        values.push(userId);
        await pool.execute(
          `UPDATE user_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
          values
        );
      }
    } else {
      const keys = Object.keys(profileData).filter(k => profileData[k] !== undefined);
      const values = keys.map(k => profileData[k]);
      if (keys.length > 0) {
        await pool.execute(
          `INSERT INTO user_profiles (user_id, ${keys.join(', ')}) VALUES (?, ${keys.map(() => '?').join(', ')})`,
          [userId, ...values]
        );
      }
    }

    // Get updated profile
    const [users] = await pool.execute(
      'SELECT id, email, user_type, credit_balance, full_name, bio, avatar_url, rating, total_reviews, created_at FROM users WHERE id = ?',
      [userId]
    );

    const [profiles] = await pool.execute(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );

    res.json({
      user: {
        ...users[0],
        profile: profiles[0] || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Calculate average rating
    const [ratingResult] = await pool.execute(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE reviewee_id = ?',
      [userId]
    );

    const avgRating = parseFloat(ratingResult[0]?.avg_rating || 0);
    const totalReviews = ratingResult[0]?.total || 0;

    // Update users table with calculated rating
    await pool.execute(
      'UPDATE users SET rating = ?, total_reviews = ? WHERE id = ?',
      [avgRating, totalReviews, userId]
    );

    // Get additional stats
    const [skillsTaught] = await pool.execute(
      'SELECT COUNT(*) as count FROM skills WHERE user_id = ? AND status = "active"',
      [userId]
    );

    const [skillsLearned] = await pool.execute(
      'SELECT COUNT(*) as count FROM bookings WHERE learner_id = ? AND status = "completed"',
      [userId]
    );

    const [followers] = await pool.execute(
      'SELECT COUNT(*) as count FROM follows WHERE followee_id = ?',
      [userId]
    );

    const [following] = await pool.execute(
      'SELECT COUNT(*) as count FROM follows WHERE follower_id = ?',
      [userId]
    );

    res.json({
      stats: {
        rating: avgRating,
        totalReviews,
        skillsTaught: skillsTaught[0]?.count || 0,
        skillsLearned: skillsLearned[0]?.count || 0,
        followers: followers[0]?.count || 0,
        following: following[0]?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
