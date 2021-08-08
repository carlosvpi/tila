const filterx = new Flux('All')
const todosx = Flux.aggregate([])
const statex = Flux.aggregate({
  filter: filterx,
  todos: todosx
})

const addTodo = statex => text => statex.get('todos').push(new Flux({ text, status: 'Active' }))
const destroyTodo = statex => todox => statex.get('todos').remove(todox)
const switchTodoStatus = todox => todox.update(todo => {
  todo.status = todo.status === 'Completed' ? 'Active' : 'Completed'
  return todo
})
const clearCompleted = statex => () => {
  const todosx = statex.get('todos')
  todosx.getStructure().slice().forEach(todox => {
    if (todox.getValue().status === 'Completed') {
      todosx.remove(todox)
    }
  })
}

const Filter = memoize((label,filterx) => {
  return tila`li`(
    tila`a`(label)
      .tap(a => {
        a.node.setAttribute('href', `#${label.toLowerCase()}`)
        statex.get('filter').pullSubscribe(filter => {
          filter === label ? a.node.classList.add('selected') : a.node.classList.remove('selected')
        })
      })
      .on`click`(() => {
        filterx.publish(label)
      })
  )
})

const Todo = memoize(todox => {
  return tila`li.todo-li.enterable`(
    tila`div.view`(
      tila`input.toggle[type=checkbox]`().on`change`(async event => {
        switchTodoStatus(todox)
        await event()
      }).tap(input => {
        todox.pullSubscribe(({ status }) => {
          input.node.checked = status === 'Completed'
        })
      }),
      tila`label`().tap(label => todox.pullSubscribe(({ text }) => label(text))),
      tila`button.destroy`().on`click`(async event => {
        destroyTodo(statex)(todox)
        await event()
      })
    )
  ).tap(li => {
    todox.pullSubscribe(({ status }) => {
      if (status === 'Completed') {
        li.node.classList.add('completed')
      } else {
        li.node.classList.remove('completed')
      }
    })
  }).onEnter(async (enter, element) => {
    element.node.classList.add('entering')
    await enter()
    setTimeout(() => {
      element.node.classList.remove('entering')
    }, 1)
  }).onExit(async (exit, element) => {
    element.node.classList.add('exiting')
    setTimeout(async () => {
      await exit()
      element.node.classList.remove('exiting')
    }, 400)
  })
})

tila(document.querySelector('section.todoapp'))(
  tila`header.header`(
    tila`h1`('Todos'),
    tila`input.new-todo[autofocus=][placeholder=What needs to be done?]`()
      .on`change`((handler, { target }) => {
        addTodo(statex)(target.value)
        target.value = ''
        handler()
      }),
  ),
  tila`setion.main`(
    tila`input#toggle-all.toggle-all[type=checkbox]`().tap(input => {
      statex.get('todos').pullSubscribe(todos => {
        input.node.checked = todos.length && todos.every(({ status }) => status === 'Completed')
      })
    }).on`change`(() => {
      if (statex.get('todos').getValue().every(({ status }) => status === 'Completed')) {
        statex.get('todos').getStructure().forEach(switchTodoStatus)
      } else {
        statex.get('todos').getStructure().forEach(todox => {
          if (todox.getValue().status === 'Active') {
            switchTodoStatus(todox)
          }
        })
      }
    }),
    tila`label[for=toggle-all]`('Mark all as complete'),
    tila`ul.todo-list`().tap(ul => {
      statex.pullSubscribe(({ filter }) => {
        const todosToShow = filter === 'All'
          ? statex.get('todos').getStructure()
          : statex.get('todos').getStructure().filter(todox => todox.getValue().status === filter)
        ul(...todosToShow.map(Todo))
      })
    })
  ),
  tila`footer.footer`(
    tila`span.todo-count`(
      tila`strong`().tap(strong => {
        statex.pullSubscribe(({ todos }) => {
          strong(todos.filter(({ status }) => status === 'Active').length)
        })
      }),
      ' items left'
    ),
    tila`ul.filters`(
      Filter('All', statex.get('filter')),
      Filter('Active', statex.get('filter')),
      Filter('Completed', statex.get('filter'))
    ),
    tila`button.clear-completed`('Clear completed').tap(button => {
      statex.get('todos').pullSubscribe(todos => {
        if (todos.some(({ status }) => status === 'Completed')) {
          button({ style: null }, ...button.children)
        } else {
          button({ style: 'display: none;' }, ...button.children)
        }
      })
    }).on`click`(clearCompleted(statex))
  ).tap(footer => {
    statex.get('todos').pullSubscribe(todos => {
      footer({ style: todos.length ? null : 'display: none;' }, ...footer.children)
    })
  })
)
