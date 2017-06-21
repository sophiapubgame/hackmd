/* eslint-env browser, jquery */
/* global serverurl, Cookies, moment */

import store from 'store'
import S from 'string'

import {
    checkIfAuth
} from './lib/common/login'

import {
    urlpath
} from './lib/config'

export function clearDuplicatedExploreNote (notehistory) {
  const newnotehistory = []
  for (let i = 0; i < notehistory.length; i++) {
    let found = false
    for (let j = 0; j < newnotehistory.length; j++) {
      const id = notehistory[i].id.replace(/=+$/, '')
      const newId = newnotehistory[j].id.replace(/=+$/, '')
      if (id === newId || notehistory[i].id === newnotehistory[j].id || !notehistory[i].id || !newnotehistory[j].id) {
        const time = (typeof notehistory[i].time === 'number' ? moment(notehistory[i].time) : moment(notehistory[i].time, 'MMMM Do YYYY, h:mm:ss a'))
        const newTime = (typeof newnotehistory[i].time === 'number' ? moment(newnotehistory[i].time) : moment(newnotehistory[i].time, 'MMMM Do YYYY, h:mm:ss a'))
        if (time >= newTime) {
          newnotehistory[j] = notehistory[i]
        }
        found = true
        break
      }
    }
    if (!found) { newnotehistory.push(notehistory[i]) }
  }
  return newnotehistory
}

function addExploreNote (id, text, time, tags, pinned, notehistory) {
    // only add when note id exists
  if (id) {
    notehistory.push({
      id,
      text,
      time,
      tags,
      pinned
    })
  }
  return notehistory
}

export function removeExploreNote (id, notehistory) {
  for (let i = 0; i < notehistory.length; i++) {
    if (notehistory[i].id === id) {
      notehistory.splice(i, 1)
      i -= 1
    }
  }
  return notehistory
}

if (!Array.isArray) {
  Array.isArray = arg => Object.prototype.toString.call(arg) === '[object Array]'
}

function renderExploreNote (title, tags) {
    // console.debug(tags);
  const id = urlpath ? location.pathname.slice(urlpath.length + 1, location.pathname.length).split('/')[1] : location.pathname.split('/')[1]
  return {
    id,
    text: title,
    time: moment().valueOf(),
    tags
  }
}

function generateExploreNote (title, tags, notehistory) {
  const info = renderExploreNote(title, tags)
    // keep any pinned data
  let pinned = false
  for (let i = 0; i < notehistory.length; i++) {
    if (notehistory[i].id === info.id && notehistory[i].pinned) {
      pinned = true
      break
    }
  }
  notehistory = removeExploreNote(info.id, notehistory)
  notehistory = addExploreNote(info.id, info.text, info.time, info.tags, pinned, notehistory)
  notehistory = clearDuplicatedExploreNote(notehistory)
  return notehistory
}

// used for outer
export function getExploreNote (callback) {
  checkIfAuth(
        () => {
          getServerExploreNote(callback)
        },
        () => {
          getServerExploreNote(callback)
        }
    )
}

function getServerExploreNote (callback) {
  $.get(`${serverurl}/history`)
        .done(data => {
          if (data.history) {
            callback(data.history)
          }
        })
        .fail((xhr, status, error) => {
          console.error(xhr.responseText)
        })
}

export function parseExploreNote (list, callback) {
  checkIfAuth(
        () => {
          parseServerToExploreNote(list, callback)
        },
        () => {
          parseServerToExploreNote(list, callback)
        }
    )
}

export function parseServerToExploreNote (list, callback) {
  $.get(`${serverurl}/explore`)
        .done(data => {
          if (data.note) {
            parseToExploreNote(list, data.note, callback)
          }
        })
        .fail((xhr, status, error) => {
          console.error(xhr.responseText)
        })
}

function parseToExploreNote (list, notes, callback) {
  if (!callback) return
  else if (!list || !notes) callback(list, notes)
  else if (notes && notes.length > 0) {
    for (let i = 0; i < notes.length; i++) {
            // parse time to timestamp and fromNow
      const timestamp = (typeof notes[i].time === 'number' ? moment(notes[i].time) : moment(notes[i].time, 'MMMM Do YYYY, h:mm:ss a'))
      notes[i].timestamp = timestamp.valueOf()
      notes[i].fromNow = timestamp.fromNow()
      notes[i].time = timestamp.format('llll')
            // prevent XSS
      notes[i].text = S(notes[i].text).escapeHTML().s
      notes[i].tags = (notes[i].tags && notes[i].tags.length > 0) ? S(notes[i].tags).escapeHTML().s.split(',') : []
            // add to list
      if (notes[i].id && list.get('id', notes[i].id).length === 0) { list.add(notes[i]) }
    }
  }
  callback(list, notes)
}