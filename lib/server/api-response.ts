export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return Response.json({ ok: true, data }, init);
}

export function apiError({
  code,
  message,
  status = 400,
  headers,
}: {
  code: string;
  message: string;
  status?: number;
  headers?: HeadersInit;
}) {
  return Response.json(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    { status, headers },
  );
}
