import dotenv from 'dotenv'

import {app} from './app.js'
import dbconnect from './db/index.js';


dotenv.config({path:'./.env'})

dbconnect()
.then(()=>{
  app.on('error',(error)=>{
    console.log("Error :: " ,error);
    throw error;
  })
  const port=process.env.PORT||3000
  app.listen(port,()=>{
    console.log(`The App is listening on ${port}`)
  })
})
.catch((error)=>{
    console.log('Error ',error);
})

