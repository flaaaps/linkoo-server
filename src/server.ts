import app1 from './app';
import http from 'http';

http.createServer(app1).listen(process.env.PORT);
