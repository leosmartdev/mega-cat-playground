import { UploadedFile as expressUploadedFile } from 'express-fileupload'
import {
  Example,
  FormField,
  Get,
  Post,
  Route,
  Security,
  Tags,
  UploadedFile
} from 'tsoa'
import Team, {
  SingleTeamResponse,
  TeamsResponse
} from '../models/bookcoin-team'
import { uploadFile, getUrlFromKey } from '../utils/fileUpload'
import { singleTeamExample, teamsResponseExample } from './api-examples/example'

@Route('teams')
@Tags('Team')
export class BookcoinController {
  /**
   * @summary Creates a team with provided information
   *
   */
  @Example<SingleTeamResponse>(singleTeamExample)
  @Security('bearerAuth')
  @Post('/create')
  public async createTeam(
    @UploadedFile() image: expressUploadedFile,
    @FormField() title: string,
    @FormField() description?: string
  ): Promise<SingleTeamResponse> {
    await uploadFile(image)

    const team = new Team({ title, description, image: image.name })
    await team.save()

    return {
      message: 'Member saved successfully!',
      data: {
        title: team.title,
        description: team.description,
        image: team.image
      }
    }
  }

  /**
   * @summary Get all created teams
   *
   */
  @Example<TeamsResponse>(teamsResponseExample)
  @Get('/index')
  public async findTeam(): Promise<TeamsResponse> {
    const teams = await Team.find()

    const processedTeams = await Promise.all(
      teams.map(async (team) => {
        const image = await getUrlFromKey(team.image)
        return {
          title: team.title,
          description: team.description,
          image
        }
      })
    )

    return {
      data: processedTeams
    }
  }
}
