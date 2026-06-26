const ok = (res, data) => res.json({ success: true, data });

const fail = (res, error, status = 400) =>
  res.status(status).json({ success: false, error });

const paged = (res, items, total, page, limit) =>
  res.json({
    success: true,
    data: {
      items,
      total: +total,
      page: +page,
      limit: +limit,
      hasMore: +page * +limit < +total,
    },
  });

module.exports = { ok, fail, paged };
