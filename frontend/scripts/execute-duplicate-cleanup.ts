import { deleteDuplicateUsers } from './cleanup-duplicate-emails'

async function main() {
  console.log('🚀 Executing duplicate cleanup...')
  console.log('This will delete 14 duplicate accounts for varun.k.nukala@gmail.com')
  console.log('Keeping only the most recent account: user_3075Py66xsCIqUWucbr3tTUfEq4')
  console.log('')
  
  await deleteDuplicateUsers()
  
  console.log('')
  console.log('🎉 Cleanup completed! Your database should now be clean.')
}

main().catch(console.error) 