const users = require('../system/users')
const groups = require('../system/groups')
const fs = require('../system/fs')

module.exports = {
  handler: (args, session) => {
    console.info(args)
    const name = args._[0]
    const {
      home,
      group,
      supplementalGroups
    } = args

    users.add(name, home, group, supplementalGroups.split(','))

    fs.mkdir(home, users.ids(name))

    fs.mkdir(`${home}/Documents`, users.ids(name))
    fs.mkdir(`${home}/Code`, users.ids(name))
    fs.write(`${home}/.bash_history`, '', users.ids(name))
    fs.write(`${home}/.bash_profile`, `source /etc/profile

    export NVM_DIR="/${home}}/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm

    nvm use 10`, users.ids(name))
  },
  args: {
    alias: {
      'home': ['h'],
      'group': ['g'],
      'supplementalGroups': ['G']
    }
  }
}
