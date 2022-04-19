export const isAdmin = (req: any, res: any, next: () => any) => {
  if (req?.user?.role >= 1) return next()

  res.status(400).send({ message: 'Insufficient Permissions' })
}
