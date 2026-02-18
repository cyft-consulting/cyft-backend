import db from "../db.js";

/**
 * CREATE ANNOUNCEMENT (Admin + Staff)
 */
export const createAnnouncement = (req, res) => {
  const { title, description } = req.body;
  const { id, role } = req.user;

  const result = db.prepare(`
    INSERT INTO announcements (title, description, createdBy, createdByRole)
    VALUES (?, ?, ?, ?)
  `).run(
    title || null,
    description || null,
    id,
    role
  );

  res.status(201).json({
    message: "Announcement created",
    id: result.lastInsertRowid,
  });
};

/**
 * GET ALL ANNOUNCEMENTS (Everyone)
 */
export const getAnnouncements = (req, res) => {
  const announcements = db.prepare(`
    SELECT 
      a.*,
      u.name AS creatorName
    FROM announcements a
    JOIN users u ON u.id = a.createdBy
    ORDER BY a.createdAt DESC
  `).all();

  const seen = db.prepare(`
    SELECT 
      s.announcementId,
      u.name,
      s.seenAt
    FROM announcement_seen s
    JOIN users u ON u.id = s.userId
  `).all();

  const seenMap = {};
  seen.forEach((s) => {
    if (!seenMap[s.announcementId]) {
      seenMap[s.announcementId] = [];
    }
    seenMap[s.announcementId].push({
      name: s.name,
      seenAt: s.seenAt,
    });
  });

  res.json(
    announcements.map((a) => ({
      ...a,
      seenBy: seenMap[a.id] || [],
    }))
  );
};

/**
 * MARK AS SEEN
 */
export const markSeen = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.prepare(`
    INSERT OR IGNORE INTO announcement_seen (announcementId, userId)
    VALUES (?, ?)
  `).run(id, userId);

  res.json({ success: true });
};

/**
 * DELETE ANNOUNCEMENT
 */
export const deleteAnnouncement = (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const announcement = db
    .prepare("SELECT * FROM announcements WHERE id = ?")
    .get(id);

  if (!announcement) {
    return res.status(404).json({ message: "Not found" });
  }

  const isAdmin = user.role === "admin";
  const isCreator = announcement.createdBy === user.id;

  // Admin-created → admin only
  if (announcement.createdByRole === "admin" && !isAdmin) {
    return res.status(403).json({ message: "Not allowed" });
  }

  // Staff-created → staff creator OR admin
  if (announcement.createdByRole === "staff" && !(isCreator || isAdmin)) {
    return res.status(403).json({ message: "Not allowed" });
  }

  db.prepare("DELETE FROM announcement_seen WHERE announcementId = ?").run(id);
  db.prepare("DELETE FROM announcements WHERE id = ?").run(id);

  res.json({ message: "Announcement deleted" });
};
