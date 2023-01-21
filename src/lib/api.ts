import axios from 'axios';

const BASE_URL = axios.create({
  baseURL: 'http://localhost:8080',
});

export default BASE_URL;
