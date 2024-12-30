/**
 * Pages.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  autoCreatedAt: true,
  autoUpdatedAt: true,
  attributes: {
    title: {
      type: 'string',
      required: true,
      unique: true
    },
    slug_name: {
      type: 'string',
      required: true
    },
    sub_title: {
      type: 'string',
      required: true
    },
    description: {},
    isDeleted: {
      type: 'Boolean',
      defaultsTo: false
    }
  }
};

