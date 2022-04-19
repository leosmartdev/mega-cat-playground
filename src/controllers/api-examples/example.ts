import {
  AuctionOfferResponse,
  SingleAuctionResponse
} from '../../models/auction'
import {
  CardSingle,
  CardsResponse,
  SingleCardResponse
} from '../../models/cards'

import {
  SingleTeamResponse,
  SingleTeam,
  TeamsResponse
} from '../../models/bookcoin-team'
import Order, { OrdersResponse, OrderResponse } from '../../models/order'

export const auctionOfferExample: AuctionOfferResponse = {
  message: 'Offers was successfully get!',
  data: [
    {
      id: '2e95f17c-4ad3-4c30-818d-b5b6d90b9354',
      nft: {
        id: '18',
        address: '0xcd0307c4b5f99264629dc2526b61d4c156b6aff3',
        chain: 'MATIC',
        name: 'Gasless Demo Test-01',
        description: 'Some description.',
        imageUrl: 'https://bkcn.s3.amazonaws.com/pexels-pixabay-459762.jpg',
        imagePreviewUrl:
          'https://bkcn.s3.amazonaws.com/pexels-pixabay-459762.jpg',
        imageThumbnailUrl:
          'https://bkcn.s3.amazonaws.com/pexels-pixabay-459762.jpg',
        animationUrls: [],
        fungible: false,
        attributes: [
          {
            type: 'system',
            name: 'tokenTypeId',
            value: '17'
          }
        ],
        contract: {
          chain: 'MATIC',
          address: '0xcd0307c4b5f99264629dc2526b61d4c156b6aff3',
          count: 0,
          name: 'Gasless Payments Collection',
          description: 'This collection is for gasless payment testing...',
          symbol: '**',
          url: 'https://bkcn.s3.amazonaws.com/pexels-mike-3601722.jpg',
          imageUrl: 'https://bkcn.s3.amazonaws.com/pexels-mike-3601722.jpg',
          media: [
            {
              type: 'image',
              value: 'https://bkcn.s3.amazonaws.com/pexels-mike-3601722.jpg'
            }
          ],
          verified: false,
          premium: false,
          categories: []
        },
        collectionIdentifier: '7c8abcab-e943-44f1-af73-0838a80abd25'
      },
      sellerId: 'b53930fb-5cb3-4e2c-81a4-f50226e4ef67',
      sellerNickname: 'megacatstudios',
      sellerAddress: '0xcc322810c276e17703925670d938a23dc5e697a1',
      startDate: '2022-02-07T07:59:16.945787Z',
      type: 'SALE',
      status: 'READY',
      dataToSign:
        '2e95f17c-4ad3-4c30-818d-b5b6d90b9354_0xcc322810c276e17703925670d938a23dc5e697a1_0x72C38DFF5Deb65F019f547170dEDd946104d573D_18',
      txInCustody:
        '0xce6dc77147150379e683d5b8e0af0318aea84025c0fc8c8d8e3b0e63e3ebaf31',
      createdOn: '2022-02-07T07:59:16.953231Z',
      createdBy: 'b53930fb-5cb3-4e2c-81a4-f50226e4ef67',
      modifiedOn: '2022-02-07T08:02:15.236967Z',
      modifiedBy: 'b53930fb-5cb3-4e2c-81a4-f50226e4ef67',
      signed: true,
      currency: 'USDC',
      price: 50,
      auction: {
        status: 'ongoing',
        expirationTime: '2022-02-28T07:59:00.000Z',
        startingBid: 50,
        ownerId: {
          name: 'John Snow',
          username: 'johnsnow01'
        },
        bids: [],
        id: 32
      }
    }
  ]
}

export const singleAuctionExample: SingleAuctionResponse = {
  auction: {
    id: 123,
    bids: [],
    expirationTime: '1234355312',
    startingBid: 10,
    ownerId: {
      name: 'John Snow',
      username: 'johnsnow01'
    },
    status: 'Ongoing'
  },
  offer: {
    id: 'sammpleOfferId',
    price: 20,
    sellerAddress: 'sampleAdress'
  }
}

const singleTeam: SingleTeam = {
  image: 'example.jpg',
  title: 'Sample Team',
  description: 'Some description'
}

export const singleTeamExample: SingleTeamResponse = {
  message: 'Member saved successfully!',
  data: singleTeam
}

export const teamsResponseExample: TeamsResponse = {
  data: [singleTeam]
}
export const ordersExample = {
  message: 'Orders was successfully get!',
  data: [
    {
      _id: '61769057a2d13f3c97249aef',
      nftId: 'cb9fa713-bbb4-4738-b4a6-b06196c74c0c',
      nftName: 'Test5',
      nftPrice: 45,
      nftImage:
        'https://bkcn.s3.ap-southeast-1.amazonaws.com/drop-3698073__340.jpg',
      tokenId: 'b53930fb-5cb3-4e2c-81a4-f50226e4ef67',
      sellerAddress: '0x52d58305510b962cc5298cb29f189e960697773d',
      buyerAddress: '0xcc322810c276e17703925670d938a23dc5e697a1'
    }
  ]
}

export const orderExample: OrderResponse = {
  message: 'Order successfully created and offers available',
  data: [
    {
      success: true,
      result: {
        id: '2e95f17c-4ad3-4c30-818d-b5b6d90b9354',
        nft: {
          id: '18',
          address: '0xcd0307c4b5f99264629dc2526b61d4c156b6aff3',
          chain: 'MATIC',
          name: 'Gasless Demo Test-01',
          description: 'Some description.',
          imageUrl: 'https://bkcn.s3.amazonaws.com/pexels-pixabay-459762.jpg',
          imagePreviewUrl:
            'https://bkcn.s3.amazonaws.com/pexels-pixabay-459762.jpg',
          imageThumbnailUrl:
            'https://bkcn.s3.amazonaws.com/pexels-pixabay-459762.jpg',
          animationUrls: [],
          fungible: false,
          attributes: [
            {
              type: 'system',
              name: 'tokenTypeId',
              value: '17'
            }
          ],
          contract: {
            chain: 'MATIC',
            address: '0xcd0307c4b5f99264629dc2526b61d4c156b6aff3',
            count: 0,
            name: 'Gasless Payments Collection',
            description: 'This collection is for gasless payment testing...',
            symbol: '**',
            url: 'https://bkcn.s3.amazonaws.com/pexels-mike-3601722.jpg',
            imageUrl: 'https://bkcn.s3.amazonaws.com/pexels-mike-3601722.jpg',
            media: [
              {
                type: 'image',
                value: 'https://bkcn.s3.amazonaws.com/pexels-mike-3601722.jpg'
              }
            ],
            verified: false,
            premium: false,
            categories: []
          },
          collectionIdentifier: '7c8abcab-e943-44f1-af73-0838a80abd25'
        },
        sellerId: 'b53930fb-5cb3-4e2c-81a4-f50226e4ef67',
        sellerNickname: 'megacatstudios',
        sellerAddress: '0xcc322810c276e17703925670d938a23dc5e697a1',
        startDate: '2022-02-07T07:59:16.945787Z',
        type: 'SALE',
        status: 'READY',
        dataToSign:
          '2e95f17c-4ad3-4c30-818d-b5b6d90b9354_0xcc322810c276e17703925670d938a23dc5e697a1_0x72C38DFF5Deb65F019f547170dEDd946104d573D_18',
        txInCustody:
          '0xce6dc77147150379e683d5b8e0af0318aea84025c0fc8c8d8e3b0e63e3ebaf31',
        createdOn: '2022-02-07T07:59:16.953231Z',
        createdBy: 'b53930fb-5cb3-4e2c-81a4-f50226e4ef67',
        modifiedOn: '2022-02-07T08:02:15.236967Z',
        modifiedBy: 'b53930fb-5cb3-4e2c-81a4-f50226e4ef67',
        signed: true,
        currency: 'USDC',
        price: 50
      }
    }
  ]
}

const singleCard: CardSingle = {
  cardId: '1234',
  cardNumber: '1234567890123456',
  expMonth: 3,
  expYear: 2023,
  name: 'someUser',
  city: 'some city',
  country: 'some country',
  line1: 'line 1',
  line2: 'line2',
  district: 'district',
  postalCode: 'code',
  userId: 'someUserId'
}

export const cardExample: SingleCardResponse = {
  message: 'Card saved successfully!',
  data: singleCard
}

export const cardsExamle: CardsResponse = {
  data: [singleCard]
}
