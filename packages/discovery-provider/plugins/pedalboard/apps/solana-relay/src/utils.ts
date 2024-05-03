import { Request } from "express"

export const getIP = (req: Request): string => {
    const ip = req.ip
    const forwardedFor = req.get('X-Forwarded-For')

    if (forwardedFor) {
        return forwardedFor
    }
    
    if (!forwardedFor && ip) {
      return ip
    }

    throw new Error("ip not found in 'X-Forwarded-For' header nor in req.ip")
  }
