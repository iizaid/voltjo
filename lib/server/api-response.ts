export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return Response.json({ ok: true, data }, init);
}

export function apiError({
  code,
  message,
  status = 400,
}: {
  code: string;
  message: string;
  status?: number;
}) {
  return Response.json(
    {
      ok: false,
      error: {
        code,
        message,
      },
    },
    { status },
  );
}
