const fs = require('../system/fs')

module.exports = {
  handler: (args, session) => {
    return session.env.PWD
  }
}
