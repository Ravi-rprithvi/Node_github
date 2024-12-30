/**
 * Connections
 * (sails.config.connections)
 *
 * `Connections` are like "saved settings" for your adapters.  What's the difference between
 * a connection and an adapter, you might ask?  An adapter (e.g. `sails-mysql`) is generic--
 * it needs some additional information to work (e.g. your database host, password, user, etc.)
 * A `connection` is that additional information.
 *
 * Each model must have a `connection` property (a string) which is references the name of one
 * of these connections.  If it doesn't, the default `connection` configured in `config/models.js`
 * will be applied.  Of course, a connection can (and usually is) shared by multiple models.
 * .
 * Note: If you're using version control, you should put your passwords/api keys
 * in `config/local.js`, environment variables, or use another strategy.
 * (this is to prevent you inadvertently sensitive credentials up to your repository.)
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.connections.html
 */

module.exports.connections = {

  /***************************************************************************
                                                                            
   Local disk storage for DEVELOPMENT ONLY                                  
                                                                            
   Installed by default.                                                    
                                                                            
  ***************************************************************************/
  localDiskDb: {
    adapter: 'sails-disk'
  },

  /***************************************************************************
                                                                            
   MySQL is the world's most popular relational database.                   
   http://en.wikipedia.org/wiki/MySQL                                       
                                                                            
   Run: npm install sails-mysql                                             
                                                                            
  ***************************************************************************/
  // someMysqlServer: {
  //   adapter: 'sails-mysql',
  //   host: 'YOUR_MYSQL_SERVER_HOSTNAME_OR_IP_ADDRESS',
  //   user: 'YOUR_MYSQL_USER', //optional
  //   password: 'YOUR_MYSQL_PASSWORD', //optional
  //   database: 'YOUR_MYSQL_DB' //optional
  // },

  /***************************************************************************
                                                                            
   MongoDB is the leading NoSQL database.                                   
   http://en.wikipedia.org/wiki/MongoDB                                     
                                                                            
   Run: npm install sails-mongo                                             
                                                                            
  ***************************************************************************/
  /*  mlabMongoServer: {
      adapter: 'sails-mongo',
      host: 'ds155130.mlab.com',
      port: 55130,
      user: 'admin', //optional
      password: 'admin1', //optional
      database: 'efarm_sails' //optional
    },
  */

  /*mlabMongoServer: {
     adapter: 'sails-mongo',
     host: 'ds111589.mlab.com',
     port: 11589,
     user: 'admin', //optional
     password: 'admin1', //optional
     database: 'staging_efarm_sails' //optional
   },*/

  // mlabMongoServer: {
  //     adapter: 'sails-mongo',
  //     host: 'localhost',
  //     port: 27017,
  //     user: '', //optional
  //     password: '', //optional
  //     database: 'newapicode' //optional
  // }


  // mlabMongoServer: {
  //   adapter: 'sails-mongo',
  //   host: 'farmx.co.in',
  //   port: 27017,
  //   user: 'demo_farmx', //optional
  //   password: 'demo_farmx', //optional
  //   database: 'farmx_demo' //optional
  // }

  // mlabMongoServer: {
  //   adapter: 'sails-mongo',
  //   host: 'dev.landx.co.in',//'13.127.61.48',
  //   port: 27017,
  //   user: 'landx', //optional
  //   password: 'Q1!zv#f3o&Rm(x4Mn', //optional
  //   database: 'landx-dev' //optional
  // }
  // mlabMongoServer: {
  //   adapter: 'sails-mongo',
  //   host: 'localhost',
  //   port: 27017,
  //   user: '', //optional
  //   password: '', //optional
  //   database: 'landx-live' //optional
  // },
  mlabMongoServer: {
    adapter: 'sails-mongo',
    host: 'dev.farmx.co.in',
    port: 27017,
    user: 'farmx', //optional
    password: 'Dzv#f3o&Rm(x4Mn', //optional
    database: 'farmx-dev' //optional
  }
  // mlabMongoServer: {
  //     adapter: 'sails-mongo',
  //     host: 'farmx.co.in',
  //     port: 27017,
  //     user: 'farmx', //optional
  //     password: 'farmx', //optional
  //     database: 'farmx' //optional
  // }



  /***************************************************************************
                                                                            
   PostgreSQL is another officially supported relational database.          
   http://en.wikipedia.org/wiki/PostgreSQL                                  
                                                                            
   Run: npm install sails-postgresql                                        
                                                                            
                                                                            
  ***************************************************************************/
  // somePostgresqlServer: {
  //   adapter: 'sails-postgresql',
  //   host: 'YOUR_POSTGRES_SERVER_HOSTNAME_OR_IP_ADDRESS',
  //   user: 'YOUR_POSTGRES_USER', // optional
  //   password: 'YOUR_POSTGRES_PASSWORD', // optional
  //   database: 'YOUR_POSTGRES_DB' //optional
  // }


  /***************************************************************************
                                                                            
   More adapters: https://github.com/balderdashy/sails                      
                                                                            
  ***************************************************************************/

};
