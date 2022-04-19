import axios from 'axios'

interface GasOracleResponse {
  status: string // "1",
  message: string // "OK",
  result: {
    LastBlock: string // "14250251",
    SafeGasPrice: string // "105",
    ProposeGasPrice: string //  "105",
    FastGasPrice: string // "106",
    suggestBaseFee: string // "104.051123527",
    gasUsedRatio: string // Comma-separated "0.891436396329452,0.0336184374270087,0.370439764473317,0.999706659906927,0.999607432983654"
  }
}

export class EtherScanAPIContract {
  baseUrl: string
  apiKey: string

  constructor(
    baseUrl: string,
    apiKey: string = 'IZY9WP94S3XIWY21ZJFZXCETII7NQWAV5G'
  ) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  /**
   * This method fetches the gas estimates from the Oracle within EtherScanAPI
   * @returns Estimates for gas price for Safe, Proposed, Fast, and basefee for gas prices.
   * See example response:
   *
   */
  async getGasOracle(): Promise<{
    data: GasOracleResponse
  }> {
    // 'https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=IZY9WP94S3XIWY21ZJFZXCETII7NQWAV5G';
    const getGasOracleUrl = `${this.baseUrl}/api?module=gastracker&action=gasoracle&apikey=${this.apiKey}`

    return axios.get(getGasOracleUrl)
  }
}
