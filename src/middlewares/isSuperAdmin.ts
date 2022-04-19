export const isSuperAdmin = (req: any, res: any, next: () => any) => {
  if (req?.user?.role == 2) return next()

  res.status(400).send({ message: 'Insufficient Permissions' })
}
