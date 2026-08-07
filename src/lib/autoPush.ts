/** Outcome of interpreting the COMMITIONAL_AUTO_PUSH environment variable. */
export type AutoPushEnv = 'truthy' | 'falsy' | 'unrecognized' | 'unset';

/** The inputs that determine whether auto-push applies to an invocation. */
export interface AutoPushInputs {
  /** True when -p or --push was passed. */
  push: boolean;
  /** True when --no-push was passed. */
  noPush: boolean;
  /** Raw, unprocessed value of COMMITIONAL_AUTO_PUSH. */
  env: string | undefined;
}

/** Result of resolving the auto-push decision, including any diagnostic to surface. */
export interface AutoPushResolution {
  /** Whether auto-push is enabled for the invocation. */
  enabled: boolean;
  /** A warning to report when the environment variable value is unrecognized. */
  warning?: string;
}

const TRUTHY = new Set(['true', '1', 'yes']);
const FALSY = new Set(['false', '0', 'no', '']);

/**
 * Parse the COMMITIONAL_AUTO_PUSH value into a normalized outcome.
 * Case-insensitive; leading and trailing whitespace is ignored.
 */
export function parseAutoPushEnv(raw: string | undefined): AutoPushEnv {
  if (raw === undefined) return 'unset';

  const value = raw.trim().toLowerCase();
  if (TRUTHY.has(value)) return 'truthy';
  if (FALSY.has(value)) return 'falsy';
  return 'unrecognized';
}

/**
 * Resolve the auto-push setting from the CLI flags and environment variable.
 * Precedence, highest first: --no-push, --push, environment variable, disabled.
 */
export function resolveAutoPush(inputs: AutoPushInputs): AutoPushResolution {
  if (inputs.noPush) return { enabled: false };
  if (inputs.push) return { enabled: true };

  const env = parseAutoPushEnv(inputs.env);
  switch (env) {
    case 'truthy':
      return { enabled: true };
    case 'unrecognized':
      return {
        enabled: false,
        warning: `COMMITIONAL_AUTO_PUSH has an unrecognized value "${inputs.env}"; auto-push is disabled. Use one of: true, 1, yes, false, 0, no.`,
      };
    default:
      return { enabled: false };
  }
}
