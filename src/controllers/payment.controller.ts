const circleUtils = require('../utils/circleUtils')

// Get PCIP Public Key
export const getPCIPublicKey = async (req: any, res: any) => {
  try {
    let data = await circleUtils.getPCIPublicKey()

    res.status(200).json({
      data: data
    })
  } catch (err) {
    console.log(err)
    res.status(400).json({
      error: err
    })
  }
}

// Process Payment
export const processPayment = async (req: any, res: any) => {
  try {
    let data = await circleUtils.processPayment(req.body)
    res.status(200).json({
      data: data
    })
  } catch (err) {
    console.log(err)
    res.status(400).json({
      error: err
    })
  }
}

// Create Card
export const createCard = async (req: any, res: any) => {
  try {
    console.log(req.body)
    let data = await circleUtils.createCard(req.body)
    res.status(200).json({
      data: data
    })
  } catch (err) {
    console.log(err)
    res.status(400).json({
      error: err
    })
  }
}
