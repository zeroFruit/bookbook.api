const env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  let config = require('./env/env.json');
  let envConfig = config[env];

  Object.keys(envConfig).forEach((key) => {
    process.env[key] = envConfig[key];
  })
}


/*
  OS에 따라서 python-shell 모듈의 pythonPath 파이썬 경로를 바꿔줘야한다.
*/
import os from 'os';
const OS = os.type();

if (OS === 'Linux') {
  process.env.PYTHONPATH = '/usr/bin/python3.5';
} else if (OS === 'Windows_NT') {
  process.env.PYTHONPATH = '/usr/bin/python3.5';
}
