const fulfilPromise = async (child, promise) => {await promise()}

const r = element => {
  const creator = (...props) => {
    const attributeKeysToRemove = new Set()
    const attributes = {}
    let childrenToRemove = creator._children
    const children = []
    const childTextNodes = Array.prototype.filter.call(creator._node.childNodes, child => child instanceof Text)
    let childTextNodeIndex = 0

    creator._node.getAttributeNames().forEach(name => attributeKeysToRemove.add(name))

    props.forEach(prop => {
      if (typeof prop === 'object') {
        Object.keys(prop).forEach(key => {
          attributeKeysToRemove.delete(key)
          if (key.indexOf('on') === 0) {
            creator._node[key] = prop[key]
          } else {
            attributes[key] = prop[key]
          }
        })
      } else if (typeof prop === 'string') {
        let textNode = childTextNodes[childTextNodeIndex]
        if (childTextNodes[childTextNodeIndex]) {
          childTextNodes[childTextNodeIndex].innerText = prop
          childTextNodeIndex++
        } else {
          textNode = r(document.createTextNode(prop))
        }
        children.push(textNode)
      } else {
        childrenToRemove = childrenToRemove.filter(childToRemove => childToRemove !== prop)
        children.push(prop)
      }
    })

    const rvsChildren = children.slice().reverse()

    attributeKeysToRemove.forEach(key => {
      creator._node.removeAttribute(key)
    })
    Object.keys(attributes).forEach(key => {
      if (creator._node.getAttribute(key) === attributes[key]) return
      creator._node.setAttribute(key, attributes[key])
    })
    childrenToRemove.forEach(child => {
      child._onExit(child, () => new Promise((resolve, reject) => {
        window.requestAnimationFrame(() => {
          if (creator._children.includes(child)) {
            reject()
          } else {
            creator._node.removeChild(child._node)
            resolve()
          }
        })
      }))
      creator._children.splice(creator._children.indexOf(child), 1)
    })
    rvsChildren.forEach((child, index) => {
      const oldIndex = creator._children.indexOf(child)

      if (oldIndex >= 0) {
        if (oldIndex !== index) {
          if (index > 0) {
            child._onMove(child, () => new Promise((resolve, reject) => {
              window.requestAnimationFrame(() => {
                throw new Error('Not coded here')
                if (creator._children.includes()) {
                  reject()
                } else {
                  creator._node.insertBefore(child._node, rvsChildren[index - 1]._node)
                  resolve()
                }
              })
            }))
            creator._children.splice(index, 0, child)
          } else {
            child._onMove(child, () => new Promise((resolve, reject) => {
              window.requestAnimationFrame(() => {
                throw new Error('Not coded here')
                if (!creator._children.includes(child)) {
                  reject()
                } else {
                  creator._node.appendChild(child._node)
                  resolve()
                }
              })
            }))
            creator._children.splice(0, 0, child)
          }
        }
      } else {
        if (index > 0) {
          child._onEnter(child, () => new Promise((resolve, reject) => {
            window.requestAnimationFrame(() => {
              if (!creator._children.includes(child)) {
                reject()
              } else {
                creator._node.insertBefore(child._node, rvsChildren[index - 1]._node)
                resolve()
              }
            })
          }))
          creator._children.splice(index, 0, child)
        } else {
          child._onEnter(child, () => new Promise((resolve, reject) => {
            window.requestAnimationFrame(() => {
              if (!creator._children.includes(child)) {
                reject()
              } else {
                creator._node.appendChild(child._node)
                resolve()
              }
            })
          }))
          creator._children.splice(0, 0, child)
        }
      }
    })
    return creator
  }
  creator._node = element instanceof Node ? element
    : element[0] === 'text' ? document.createTextNode()
    : document.createElement(element[0])
  creator._children = element instanceof Node
    ? Array.prototype.map.call(element.childNodes, r)
    : []
  creator._onEnter = fulfilPromise
  creator._onExit = fulfilPromise
  creator._onMove = fulfilPromise
  creator.onEnter = f => {
    creator._onEnter = f
    return creator
  }
  creator.onExit = f => {
    creator._onExit = f
    return creator
  }
  creator.onMove = f => {
    creator._onMove = f
    return creator
  }
  creator.tap = f => (f(creator), creator)
  return creator
}

window.r = r

window.memoize = f => {
  const map = new Map()
  return v => {
    if (!map.has(v)) {
      map.set(v, f(v))
    }
    return map.get(v)
  }
}