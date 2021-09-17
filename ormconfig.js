
module.exports = {
   "type": "postgres",
   "host": process.env.POSTGRES_HOST || "localhost",
   "port": process.env.POSTGRES_PORT || 3306,
   "username": process.env.POSTGRES_USER || "admin",
   "password": process.env.POSTGRES_PASSWORD || "admin",
   "database": "backup",
   "synchronize": true,
   "logging": false,
   "entities": [
      "dist/database/entity/**/*.js"
   ],
   "migrations": [
      "dist/database/migration/**/*.js"
   ],
   "subscribers": [
      "dist/database/subscriber/**/*.js"
   ],
   "cli": {
      "entitiesDir": "dist/database/entity",
      "migrationsDir": "dist/database/migration",
      "subscribersDir": "dist/database/subscriber"
   }
}

