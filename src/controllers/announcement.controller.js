import { pool } from "../db/postgres.js";

/**
 * CREATE ANNOUNCEMENT (Admin + Staff)
 */
export const createAnnouncement = async (req, res) => {
  try {
    const { title, description } = req.body;
    const { id, role } = req.user;

    const result = await pool.query(
      `INSERT INTO announcements (title, description, createdBy, createdByRole)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [title || null, description || null, id, role]
    );

    res.status(201).json({
      message: "Announcement created",
      id: result.rows[0].id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET ALL ANNOUNCEMENTS (Everyone)
 */
export const getAnnouncements = async (req, res) => {
  try {
    const announcementsRes = await pool.query(`
      SELECT 
        a.*, 
        u.name AS creatorName
      FROM announcements a
      JOIN users u ON u.id = a.createdBy
      ORDER BY a.createdAt DESC
    `);

    const seenRes = await pool.query(`
      SELECT 
        s.announcementId, 
        u.name, 
        s.seenAt
      FROM announcement_seen s
      JOIN users u ON u.id = s.userId
    `);

    const seenMap = {};
    seenRes.rows.forEach((s) => {
      if (!seenMap[s.announcementid]) seenMap[s.announcementid] = [];
      seenMap[s.announcementid].push({
        name: s.name,
        seenAt: s.seenat,
      });
    });

    const announcements = announcementsRes.rows.map((a) => ({
      ...a,
      seenBy: seenMap[a.id] || [],
    }));

    res.json(announcements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * MARK AS SEEN
 */
export const markSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query(
      `INSERT INTO announcement_seen (announcementId, userId)
       VALUES ($1, $2)
       ON CONFLICT (announcementId, userId) DO NOTHING`,
      [id, userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * DELETE ANNOUNCEMENT
 */
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const announcementRes = await pool.query(
      `SELECT * FROM announcements WHERE id = $1`,
      [id]
    );
    const announcement = announcementRes.rows[0];

    if (!announcement) {
      return res.status(404).json({ message: "Not found" });
    }

    const isAdmin = user.role === "admin";
    const isCreator = announcement.createdby === user.id;

    // Admin-created → admin only
    if (announcement.createdbyrole === "admin" && !isAdmin) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Staff-created → staff creator OR admin
    if (announcement.createdbyrole === "staff" && !(isCreator || isAdmin)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await pool.query(
      `DELETE FROM announcement_seen WHERE announcementId = $1`,
      [id]
    );
    await pool.query(
      `DELETE FROM announcements WHERE id = $1`,
      [id]
    );

    res.json({ message: "Announcement deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
