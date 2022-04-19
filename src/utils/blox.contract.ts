import axios from 'axios'

export class BloxContract {
  baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  /**
   * This method
   * @param quantity Quantity of NFTs to mint for Drop.
   * @param to Recipient to receive NFTs.
   * @param contractName Name of the smart contract class for looking up based on source code.
   * @param contractAddress Blockchain address of smart contract.
   * @param chain Chain/Netowork that smart contract is deployed on.
   * @returns Results of minting
   */
  async dropMint(
    quantity: number,
    tokenIds: string[],
    to: string,
    contractName: string,
    contractAddress: string,
    network: string
  ): Promise<any> {
    const bloxMintUrl = `${this.baseUrl}/blockchain/contract/staging/dropMint`
    const body = {
      quantity,
      tokenIds,
      to,
      contractName,
      contractAddress,
      network
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer 213df0c8-8443-11ec-a8a3-0242ac120002`
    }

    return axios.post(bloxMintUrl, body, { headers })
  }

  /**
   * This method retrieves transaction receipt from network
   */
  async getTransactionReceipt(txHash, network): Promise<any> {
    const bloxMintUrl = `${this.baseUrl}/blockchain/validate/transferTx`
    const body = {
      txHash,
      network
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer 213df0c8-8443-11ec-a8a3-0242ac120002`
    }

    return axios.post(bloxMintUrl, body, { headers })
  }
}
