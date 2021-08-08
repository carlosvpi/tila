const fulfilPromise = async promise => {
  try {
    await promise()
  } catch (e) {
  }
}

const tila = element => {
  const creator = (...props) => {
    if (creator.node instanceof Text) {
      (persistingText => {
        window.requestAnimationFrame(() => {
          creator.node.innerText = persistingText
        })
      })(props[0])
      return creator
    }
    const attributeKeysToRemove = new Set()
    const attributes = {}
    let childrenToRemove = creator.children.slice()
    const children = []
    const textNodeChildren = creator.children.filter(child => child.node instanceof Text)
    let childTextNodeIndex = 0

    props.forEach(prop => {
      if (typeof prop === 'object') {
        Object.keys(prop).forEach(key => {
          if (prop[key] === null || prop[key] === undefined) {
            attributeKeysToRemove.add(key)
          } else {
            attributes[key] = prop[key]
          }
        })
      } else if (typeof prop !== 'function') {
        let textNode = textNodeChildren[childTextNodeIndex]
        if (textNode) {
          textNode.node.data = prop
          childTextNodeIndex++
          children.push(textNode)
        } else {
          children.push(tila(document.createTextNode(prop)))
        }
      } else {
        let index = childrenToRemove.indexOf(prop)
        if (index >= 0) {
          childrenToRemove.splice(index, 1)
        }
        children.push(prop)
      }
    })

    attributeKeysToRemove.forEach(key => {
      creator.node.removeAttribute(key)
    })
    Object.keys(attributes).forEach(key => {
      if (creator.node.getAttribute(key) === attributes[key]) return
      creator.node.setAttribute(key, attributes[key])
    })
    childrenToRemove.forEach(child => {
      child._onExit(() => new Promise((resolve, reject) => {
        window.requestAnimationFrame(() => {
          if (creator.children.includes(child)) {
            reject()
          } else {
            creator.node.removeChild(child.node)
            resolve()
          }
        })
      }), child)
      creator.children.splice(creator.children.indexOf(child), 1)
    })

    const rvsChildren = children.slice().reverse()

    rvsChildren.forEach((child, index) => {
      const oldIndex = creator.children.indexOf(child)

      if (oldIndex >= 0) {
        if (oldIndex !== index) {
          (persistingIndex => child._onMove(() => new Promise((resolve, reject) => {
            window.requestAnimationFrame(() => {
              if (creator.children.indexOf(child) !== persistingIndex) {
                reject()
              } else {
                if (persistingIndex > 0) {
                  creator.node.insertBefore(child.node, rvsChildren[persistingIndex - 1].node)
                } else {
                  creator.node.appendChild(child.node)
                }
                resolve()
              }
            })
          }), child, index, oldIndex))(index)
          creator.children.splice(oldIndex, 1)
          creator.children.splice(rvsChildren.length - index - 1, 0, child)
        }
      } else {
        (persistingIndex => child._onEnter(() => new Promise((resolve, reject) => {
          window.requestAnimationFrame(() => {
            if (!creator.children.includes(child)) {
              reject()
            } else {
              if (index > 0) {
                creator.node.insertBefore(child.node, rvsChildren[persistingIndex - 1].node)
              } else {
                creator.node.appendChild(child.node)
              }
              resolve()
            }
          })
        }), child))(index)
        creator.children.splice(index, 0, child)
      }
    })
    return creator
  }
  creator.node = element instanceof Node ? element
    : element[0] === 'text' ? document.createTextNode()
    : (query => {
      const tag = query.match(/\w+/)?.[0] || 'div'
      const classes = query.match(/\.[^\.\[\#]+/g)?.map(item => item.slice(1)) || []
      const id = query.match(/\#[^\.\[\#]+/)?.[0] || null
      const attrs = new Map()
      while (true) {
        let match = query.match(/\[([^\.\[\#]+)=([^\.\[\#]*)\]/)
        if (!match) { break }
        query = query.slice(match.index + match[0].length)
        attrs.set(match[1], match[2])
      }
      const element = document.createElement(tag)
      classes.forEach(classItem => element.classList.add(classItem))
      id && element.setAttribute('id', id.slice(1))
      attrs.forEach((value, key) => {
        element.setAttribute(key, value)
      })
      return element
    })(element[0])
  creator.children = element instanceof Node
    ? Array.prototype.map.call(element.childNodes, tila)
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
  creator.on = ([eventName]) => (eventHandler) => {
    let promise = { current: null }
    const getPromise = (...args) => {
      eventHandler(() => new Promise(resolve => {
        promise.current = resolve
      }), ...args)
    }
    const usePromise = (...args) => {
      promise.current && promise.current(...args)
    }
    creator.node.removeEventListener(eventName, creator[`capturing:on${eventName}`], true)
    creator.node.removeEventListener(eventName, creator[`bubbling:on${eventName}`], false)
    creator.node.addEventListener(eventName, getPromise, true)
    creator.node.addEventListener(eventName, usePromise, false)
    creator[`capturing:on${eventName}`] = getPromise
    creator[`bubbling:on${eventName}`] = usePromise
    return creator
  }
  creator.tap = f => (f(creator), creator)
  return creator
}

window.tila = tila

window.memoize = f => {
  const map = new Map()
  return v => {
    if (!map.has(v)) {
      map.set(v, f(v))
    }
    return map.get(v)
  }
}