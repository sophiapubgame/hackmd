'use strict'
// explore
// external modules

// core
var config = require('./config')
var logger = require('./logger')
var response = require('./response')
var models = require('./models')
var LZString = require('lz-string')
var permission = require('./config').permission

// public
var Explore = {
  exploreGet: exploreGet
}

function getExplore (callback) {
  models.Note.all({
    where: {
      permission: {
        $ne: permission.private
      },
      alias: {
        $eq: null
      }
    }
  }).then(notes => {
    var exploreNote = {}
    notes.forEach(note => {
      var id = LZString.compressToBase64(note.id)
      exploreNote[id] = {
        id: id,
        text: note.title,
        time: new Date(note.updatedAt).getTime(),
        tags: JSON.parse(note.tags),
        permission: note.permission
      }
    })
    return callback(null, exploreNote)
  }).catch(function (err) {
    logger.error('read explore note failed: ' + err)
    return callback(err, null)
  })
}

function parseNotesToArray (notes) {
  var _notes = []
  Object.keys(notes).forEach(function (key) {
    var item = notes[key]
    _notes.push(item)
  })
  return _notes
}

function parseNotesToObject (notes) {
  var _notes = {}
  for (var i = 0, l = notes.length; i < l; i++) {
    var item = notes[i]
    _notes[item.id] = item
  }
  return _notes
}

function exploreGet (req, res) {
  getExplore(function (err, notes) {
    if (err) return response.errorInternalError(res)
    if (!notes) return response.errorNotFound(res)
    res.send({
      note: parseNotesToArray(notes)
    })
  })
}

module.exports = Explore
