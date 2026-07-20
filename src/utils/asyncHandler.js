// Express 4, async route handler'larindaki reddedilen promise'leri otomatik
// yakalamaz - bu sarmalayici olmadan bir DB hatasi tum sureci cokertebilir.
// (config/database.js'deki MSSQL baglanti hatasini test ederken bu sorunu
// bizzat gozlemledik.)
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
