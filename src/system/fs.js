const {
  resolve
} = require('path')

const createDir = ({ uid, gid, perms } = {}) => {
  return {
    uid: uid || 0,
    gid: gid || 0,
    perms: perms || parseInt('0755', 8),
    size () {
      return Object.keys(this.children).reduce((acc, curr) => {
        return acc + this.children[curr].size()
      }, 0)
    },
    mtime: new Date(),
    children: { }
  }
}

const createFile = (content = '', { uid, gid, perms } = {}) => {
  return {
    uid: uid || 0,
    gid: gid || 0,
    perms: perms || parseInt('0755', 8),
    size () {
      return this.content.length
    },
    mtime: new Date(),
    content
  }
}

let pwd = '/home/alex'
const fileSystem = createDir({
  uid: 0,
  gid: 0
})

const fs = {
  pwd: () => {
    return pwd
  },
  getNode: (input, session) => {
    let path = normalisePath(input, session)

    if (path === '/') {
      return fileSystem
    }

    path = path.replace(/^\/+/g, '').replace(/\/+$/g, '')
    const parts = path.split('/')
    let node = fileSystem.children[parts[0]]

    if (!node) {
      return
    }

    for (let i = 1; i < parts.length; i++) {
      if (!node.children[parts[i]]) {
        return
      }

      node = node.children[parts[i]]
    }

    return node
  },
  mkdir: (input, session, opts) => {
    let path = normalisePath(input, session)

    path = path.replace(/^\/+/g, '').replace(/\/+$/g, '')
    const parts = path.split('/')
    let node = fileSystem

    for (let i = 0; i < parts.length; i++) {
      let child = node.children[parts[i]]

      if (child) {
        node = child
        continue
      }

      if (opts.p || i === parts.length - 1) {
        node = node.children[parts[i]] = createDir(opts)

        continue
      }

      throw new Error(`mkdir: ${input}: No such file or directory`)
    }
  },
  write: (input, content, session, opts) => {
    let path = normalisePath(input, session)

    path = path.replace(/^\/+/g, '').replace(/\/+$/g, '')
    const parts = path.split('/')
    let node = fileSystem

    const file = parts.pop()

    for (let i = 0; i < parts.length; i++) {
      let child = node.children[parts[i]]

      if (child) {
        node = child
        continue
      }

      if (opts.p) {
        node = node.children[parts[i]] = createDir(opts)

        continue
      }

      throw new Error(`write: ${input}: No such file or directory`)
    }

    node.children[file] = createFile(content, opts)
  },
  read: (input, session) => {
    let path = normalisePath(input, session)
    const node = fs.getNode(path, session)

    if (!node) {
      throw new Error(`read: ${input}: No such file or directory`)
    }

    return node.content
  },
  rm: (input, session, opts) => {
    let path = normalisePath(input, session)

    path = path.replace(/^\/+/g, '').replace(/\/+$/g, '')
    const parts = path.split('/')
    let node = fileSystem

    const file = parts.pop()

    for (let i = 0; i < parts.length; i++) {
      let child = node.children[parts[i]]

      if (child) {
        node = child
        continue
      }

      throw new Error(`rm: ${input}: No such file or directory`)
    }

    if (!node.children[file]) {
      throw new Error(`rm: ${input}: No such file or directory`)
    }

    if (node.children[file].children && !opts.r) {
      throw new Error(`rm: ${input}: is a directory`)
    }

    delete node.children[file]
  },
  ls: (input, session) => {
    let path = normalisePath(input || session.env.PWD, session)
    const node = fs.getNode(path, session)

    if (!node) {
      throw new Error(`read: ${input}: No such file or directory`)
    }

    if (node.content !== undefined) {
      return [{
        name: path.split('/').pop(),
        node: node
      }]
    }

    return Object.keys(node.children)
      .map(name => {
        return {
          name: name,
          node: node.children[name]
        }
      })
  }
}

function normalisePath (input, session) {
  let path = input

  if (path.substring(0, 2) === '~/') {
    path = `${session.env.HOME}/${path.substring(2)}`
  }

  if (path.substring(0, 1) !== '/') {
    path = `${pwd}/${path}`
  }

  path = path.replace(/\/+/g, '/')
  path = path.replace(/^\/+/g, '').replace(/\/+$/g, '')
  path = `/${path}`

  path = resolve(path)

  return path
}

module.exports = fs
