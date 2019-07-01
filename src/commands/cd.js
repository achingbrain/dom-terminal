const fs = require('../system/fs')

module.exports = {
  handler: ({ _ }, session) => {
    let path = _[0] || session.env.HOME
    const node = fs.getNode(path)

    if (!node) {
      throw new Error(`cd: ${input}: No such file or directory`)
    }

    session.env.PWD = path
  }
}
