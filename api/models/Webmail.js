/**
 * Webmail.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  autoCreatedAt: true,
  autoUpdatedAt: true,

  attributes: {

    to: {
      type: 'string',
      required: true
    },

    from: {
      type: 'string',
      required: true
    },

    subject: {
      type: 'string',
      required: true
    },

    cc: {
      type: 'string'
    },

    bcc: {
      type: 'string'
    },

    message: {
      type: 'string'
    }

  }
};

