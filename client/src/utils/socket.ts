import {io,Socket} from "socket.io-client"
import { baseUrl } from "./constant"

const createsocketConnection = ():Socket | null =>{
    if(window.location.hostname ==="localhost"){
        return io(baseUrl)
    }
    return null
}


export default createsocketConnection