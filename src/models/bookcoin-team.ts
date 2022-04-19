import mongoose, { Document, model, Model } from 'mongoose'

export interface TeamPayload {
  /**
   * Team Title
   * @example "Sample team"
   */
  title: string
  /**
   * Some description about team
   * @example "Some Description"
   */
  description?: string
}

export interface SingleTeam extends TeamPayload {
  image: string | null
}

export interface SingleTeamResponse {
  message: string
  data: SingleTeam
}

export interface ITeamDocument extends SingleTeam, Document {}

export interface TeamsResponse {
  data: SingleTeam[]
}

const TeamSchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    image: { type: String }
  },
  {
    timestamps: true
  }
)

const Team: Model<ITeamDocument> = model<ITeamDocument>('team', TeamSchema)
export default Team
