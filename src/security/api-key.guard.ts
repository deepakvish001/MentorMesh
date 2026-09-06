import { CanActivate, ExecutionContext, Injectable, SetMetadata, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

export type ApiRole = "member" | "coordinator";
export type ApiPrincipal = { key: string; role: ApiRole };

export const PUBLIC_ROUTE = "mentormesh.public";
export const REQUIRED_ROLES = "mentormesh.roles";
export const Public = () => SetMetadata(PUBLIC_ROUTE, true);
export const Roles = (...roles: ApiRole[]) => SetMetadata(REQUIRED_ROLES, roles);

export function parseApiKeys(value: string | undefined): Map<string, ApiPrincipal> {
  if (!value?.trim()) throw new Error("API_KEYS is required; refusing to start without authentication");
  const principals = new Map<string, ApiPrincipal>();
  for (const entry of value.split(",")) {
    const separator = entry.lastIndexOf(":");
    if (separator < 1) throw new Error("API_KEYS entries must use key:role format");
    const key = entry.slice(0, separator).trim();
    const role = entry.slice(separator + 1).trim();
    if (key.length < 16) throw new Error("API keys must contain at least 16 characters");
    if (role !== "member" && role !== "coordinator") throw new Error(`unsupported API role: ${role}`);
    if (principals.has(key)) throw new Error("duplicate API key configured");
    principals.set(key, { key, role });
  }
  return principals;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly principals: Map<string, ApiPrincipal>) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest();
    const raw = request.headers?.["x-api-key"];
    const key = Array.isArray(raw) ? raw[0] : raw;
    const principal = typeof key === "string" ? this.principals.get(key) : undefined;
    if (!principal) throw new UnauthorizedException("a valid x-api-key header is required");
    const roles = this.reflector.getAllAndOverride<ApiRole[]>(REQUIRED_ROLES, [context.getHandler(), context.getClass()]);
    if (roles?.length && !roles.includes(principal.role)) throw new ForbiddenException("insufficient role");
    request.principal = { role: principal.role };
    return true;
  }
}
