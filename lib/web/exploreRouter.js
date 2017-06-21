'use strict'

const Router = require('express').Router

const {urlencodedParser} = require('./utils')
const explore = require('../explore')
const exploreRouter = module.exports = Router()

// get explore notes
exploreRouter.get('/explore', explore.exploreGet)
