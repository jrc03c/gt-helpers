function pause(ms) {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(resolve, ms)
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = pause
