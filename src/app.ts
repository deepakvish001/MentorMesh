import {
  ArgumentsHost, Body, Catch, Controller, ExceptionFilter, Get, HttpException, HttpStatus,
  Module, Param, Post, Put, Query,
} from "@nestjs/common";
import { GoalNotFoundError, GoalRuleError, GoalService } from "./goals/goal-service.js";
import { MatchRequest, MatchRequestError, MatchingService } from "./matching/matching-service.js";
import { ProfileInput, ProfileRole, ProfileValidationError } from "./profiles/profile.js";
import { InMemoryProfileRepository, ProfileNotFoundError } from "./profiles/profile-repository.js";
import { ScheduleSession, SessionNotFoundError, SessionRuleError, SessionService } from "./sessions/session-service.js";

@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profiles: InMemoryProfileRepository) {}

  @Post()
  create(@Body() input: ProfileInput) { return this.profiles.create(input); }

  @Get()
  list(@Query("role") role?: ProfileRole) { return this.profiles.list(role); }

  @Get(":id")
  get(@Param("id") id: string) { return this.profiles.get(id); }

  @Put(":id")
  update(@Param("id") id: string, @Body() input: ProfileInput) { return this.profiles.update(id, input); }
}

@Controller("matches")
export class MatchesController {
  constructor(private readonly matching: MatchingService) {}
  @Post()
  find(@Body() input: MatchRequest) { return this.matching.findMatches(input); }
}

@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessions: SessionService) {}
  @Post()
  schedule(@Body() input: ScheduleSession) { return this.sessions.schedule(input); }
  @Get()
  list(@Query("profileId") profileId?: string) { return this.sessions.list(profileId); }
  @Post(":id/cancel")
  cancel(@Param("id") id: string) { return this.sessions.cancel(id); }
  @Post(":id/complete")
  complete(@Param("id") id: string) { return this.sessions.complete(id); }
}

@Controller("goals")
export class GoalsController {
  constructor(private readonly goals: GoalService) {}
  @Post()
  create(@Body() input: { learnerId: string; title: string }) { return this.goals.create(input.learnerId, input.title); }
  @Get()
  list(@Query("learnerId") learnerId: string) { return this.goals.list(learnerId); }
  @Post(":id/milestones")
  milestone(@Param("id") id: string, @Body() input: { title: string }) { return this.goals.addMilestone(id, input.title); }
  @Post(":id/milestones/:milestoneId/complete")
  completeMilestone(@Param("id") id: string, @Param("milestoneId") milestoneId: string) { return this.goals.completeMilestone(id, milestoneId); }
  @Post(":id/complete")
  complete(@Param("id") id: string) { return this.goals.complete(id); }
}

@Controller()
export class HealthController {
  @Get("healthz")
  health() { return { status: "ok" }; }
}

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    if (error instanceof HttpException) throw error;
    const response = host.switchToHttp().getResponse();
    const notFound = error instanceof ProfileNotFoundError || error instanceof SessionNotFoundError || error instanceof GoalNotFoundError;
    const badRequest = error instanceof ProfileValidationError || error instanceof MatchRequestError || error instanceof SessionRuleError || error instanceof GoalRuleError;
    const status = notFound ? HttpStatus.NOT_FOUND : badRequest ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = error instanceof Error && status !== HttpStatus.INTERNAL_SERVER_ERROR ? error.message : "internal server error";
    response.status(status).json({ statusCode: status, message });
  }
}

const profiles = new InMemoryProfileRepository();

@Module({
  controllers: [HealthController, ProfilesController, MatchesController, SessionsController, GoalsController],
  providers: [
    { provide: InMemoryProfileRepository, useValue: profiles },
    { provide: MatchingService, useFactory: () => new MatchingService(profiles) },
    { provide: SessionService, useFactory: () => new SessionService(profiles) },
    { provide: GoalService, useFactory: () => new GoalService(profiles) },
  ],
})
export class AppModule {}
