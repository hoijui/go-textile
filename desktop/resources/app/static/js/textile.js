const session = require('electron').remote.session.defaultSession

let textile = {

  init: function() {
    asticode.loader.init()
    asticode.modaler.init()
    asticode.notifier.init()

    document.addEventListener('astilectron-ready', function() {
      textile.listen()
    })
  },

  listen: function() {
    astilectron.onMessage(function(msg) {
      switch (msg.name) {

        case 'login':
          login(msg)
          break

        case 'setup':
          setAddress(msg.qr, msg.pk)
          break

        case 'preready':
          hideSetup()
          break

        case 'ready':
          renderThreads(msg.threads)
          showMain()
          break

        case 'wallet.update':
          switch (msg.update.type) {
            // thread added
            case 0:
              addThread(msg.update)
              break
          }
          break

        case 'thread.update':
          switch (msg.update.type) {
            // photo added
            case 1:
              addPhoto(msg.update)
              break
          }
          break

      }
    })
  },
}

function setAddress(qr, pk) {
  $('.logo').addClass('hidden')
  let qrCode = $('.qr-code')
  qrCode.attr('src', 'data:image/png;base64,' + qr)
  qrCode.removeClass('hidden')
  $('.address').text('Address: ' + pk)
}

function hideSetup() {
  $('.setup').addClass('hidden')
}

function showMain() {
  $('.main').removeClass('hidden')
}

function renderThreads(threads) {
  threads.forEach(function (thread) {
    addThread(thread)
  })

  if (threads.length > 0) {
    loadFirstThread()
  }
}

function addThread(update) {
  let ul = $('.threads')
  let title = '<h5># ' + update.name + '</h5>'
  $('<li class="thread" id="' + update.id + '" onclick="loadThread(this)">' + title + '</li>').appendTo(ul)
  if (ul.children().length === 1) {
    loadFirstThread()
  }
}

function loadFirstThread() {
  setTimeout(function () {
    $('.threads li').first().click()
  }, 0)
}

function loadThread(el) {
  let $el = $(el)
  let id = $el.attr('id')
  $('.thread.active').removeClass('active')
  $el.addClass('active')
  astilectron.sendMessage({name: 'thread.load', payload: id}, function (message) {
    if (message.name === 'error') {
      asticode.notifier.error(message)
      return
    }
    showGrid(id, message.payload.html)
  })
}

function showGrid(threadId, html) {
  clearGrid()
  $('.message').addClass('hidden')
  let grid = $('<div class="grid" data-thread-id="' + threadId + '"></div>')
  grid.appendTo($('.content'))

  grid.html(html)
  let $grid = grid.isotope({
    layoutMode: 'cellsByRow',
    itemSelector: '.grid-item',
    cellsByRow: {
      columnWidth: 192,
      rowHeight: 192
    },
    transitionDuration: '0.2s',
    hiddenStyle: {
      opacity: 0,
      transform: 'scale(0.9)'
    },
    visibleStyle: {
      opacity: 1,
      transform: 'scale(1)'
    }
  })

  // layout after each image loads
  $grid.imagesLoaded().progress(function() {
    if ($grid.data('isotope')) {
      $grid.isotope('layout')
    }
  })

  // reveal items
  let $items = $grid.find('.grid-item')
  $grid.addClass('is-showing-items').isotope('revealItemElements', $items)
}

function clearGrid() {
  let grid = $('.grid')
  if (grid) {
    grid.remove()
  }
}

function addPhoto(update) {
  let grid = $('.grid')
  if (!grid || update.thread_id !== grid.data('thread-id')) {
    return
  }
  let photo = fileURL(update, 'photo')
  let thumb = fileURL(update, 'thumb')
  let meta = fileURL(update, 'meta')
  let img = '<img src="' + thumb + '" />'
  let $item = $('<div id="' + update.id + '" class="grid-item" '
    + 'ondragstart="imageDragStart(event);" draggable="true" '
    + 'data-url="' + photo + '" data-meta="' + meta + '">' + img + '</div>')
  grid.isotope('insert', $item)
}

function fileURL(update, path) {
  return [textile.gateway, 'ipfs', update.target_id, path].join('/') + '?block=' + update.id
}

function login(data) {
  textile.gateway = data.gateway
  let expiration = new Date()
  let hour = expiration.getHours()
  hour = hour + 6
  expiration.setHours(hour)
  session.cookies.set({
    url: data.gateway,
    name: data.name,
    value: data.value,
    expirationDate: expiration.getTime(),
    session: true
  }, function (err) {
    // console.error(err)
  })
}