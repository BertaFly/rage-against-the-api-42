import axios from 'axios'

// const myToken = '89f8a3e8-3857-40e5-bc31-c94ae628d6fc'
const sandboxToken = '3b036afe-0110-4202-b9ed-99718476c2e0'

const axiosInstance = axios.create({
  baseURL: 'https://api.navitia.io/v1/coverage/sandbox',
  headers: {'Authorization': sandboxToken}
})

export default axiosInstance
