import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { clerkClient } from '@clerk/nextjs/server'

// Force dynamic rendering to prevent build-time database calls
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Daily emails cron job triggered')
    console.log('⏰ Cron job executed at:', new Date().toISOString())

    // Get all users who have been inactive for 48+ hours (motivational notifications)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
    
    // Get all user progress records
    const { data: allUsers, error } = await supabase
      .from('user_progress')
      .select('*')
    
    if (error) throw error
    
    // Filter users who have been inactive for 48+ hours (motivational notifications)
    const inactiveUsers = allUsers?.filter(user => {
      const lastActivity = new Date(user.updated_at || user.created_at)
      return lastActivity < fortyEightHoursAgo
    }) || []

    // Filter users who need 24-hour reset notifications
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const usersNeedingReset = allUsers.filter(user => {
      // Only consider users who have actually been reset before (not new users)
      if (!user.last_reset_date) {
        return false; // Skip new users who haven't had their first reset yet
      }
      
      // Check if it's been 24+ hours since their last reset
      return new Date(user.last_reset_date) < twentyFourHoursAgo
    })

    // Log detailed timing information for 6-hour cron debugging
    const now = new Date();
    console.log(`⏰ Cron job executed at: ${now.toISOString()}`);
    console.log(`🕐 24-hour threshold: ${twentyFourHoursAgo.toISOString()}`);
    console.log(`📊 Total users in system: ${allUsers.length}`);
    console.log(`📧 Found ${inactiveUsers.length} users needing motivational notifications`)
    console.log(`🔄 Found ${usersNeedingReset.length} users needing 24-hour reset notifications`)

    // Also find new users who need their first reset (created more than 24 hours ago but never reset)
    const newUsersNeedingFirstReset = allUsers.filter(user => {
      // User has no last_reset_date (never been reset)
      // AND user was created more than 24 hours ago
      // AND user has some activity (has tasks or has been active)
      if (user.last_reset_date) {
        return false; // Already been reset before
      }
      
      const userCreatedMoreThan24HoursAgo = new Date(user.created_at) < twentyFourHoursAgo;
      const hasActivity = user.updated_at && new Date(user.updated_at) > new Date(user.created_at);
      
      return userCreatedMoreThan24HoursAgo && hasActivity;
    });

    console.log(`🆕 Found ${newUsersNeedingFirstReset.length} new users needing their first reset`)

    let notificationsSent = 0
    let errors = 0

    // Send motivational notifications to inactive users
    for (const user of inactiveUsers) {
      try {
        // Calculate time since last activity
        const lastActivity = new Date(user.updated_at || user.created_at)
        const hoursSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60))
        
        // Get user's tasks to determine notification type
        const { data: userTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.user_id);
        
        // Skip users who have never created tasks (inactive accounts)
        if (!userTasks || userTasks.length === 0) {
          console.log(`⏭️ Skipping user ${user.user_id} - no tasks created`);
          continue;
        }
        
        // Skip users who haven't opted into notifications
        if (!user.notifications_enabled) {
          console.log(`⏭️ Skipping user ${user.user_id} - notifications not enabled`);
          continue;
        }
        
        // Determine notification type based on user's activity
        const userCreatedDate = new Date(user.created_at).toISOString().split('T')[0]
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const completedTasks = userTasks?.filter(task => task.completed) || []
        
        let notificationType = 'motivational'
        if (userCreatedDate === yesterday || userCreatedDate === today) {
          notificationType = 'welcome'
        } else if (completedTasks.length <= 1) {
          notificationType = 'encouragement'
        }
        
        console.log(`📱 Sending ${notificationType} notification to inactive user ${user.user_id.slice(-8)} (${hoursSinceActivity}h inactive)`)

        // Send Firebase notification instead of email
        try {
          const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send-firebase`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.user_id,
              notification: {
                title: notificationType === 'welcome' ? '🌟 Welcome to Teyra!' : '💪 Time to Get Back on Track!',
                body: notificationType === 'welcome' 
                  ? 'Let\'s start building amazing habits together!'
                  : `It's been ${hoursSinceActivity} hours since your last activity. Ready to tackle some tasks?`,
                data: {
                  type: notificationType,
                  hoursSinceActivity,
                  taskSummary: {
                    total: userTasks?.length || 0,
                    completed_count: completedTasks.length,
                    incomplete_count: userTasks.length - completedTasks.length
                  }
                }
              }
            })
          });

          if (notificationResponse.ok) {
            notificationsSent++;
            console.log(`✅ Motivational notification sent to user ${user.user_id.slice(-8)}`);
          } else {
            errors++;
            console.error(`❌ Failed to send motivational notification to user ${user.user_id.slice(-8)}`);
          }
        } catch (notificationError) {
          errors++;
          console.error(`❌ Error sending motivational notification to user ${user.user_id.slice(-8)}:`, notificationError);
        }

      } catch (error) {
        errors++
        console.error(`❌ Error processing motivational notification for user ${user.user_id}:`, error)
      }
    }

    // Send reset notifications to users who need 24-hour reset
    for (const user of usersNeedingReset) {
      try {
        // Get user's actual email from Clerk for logging
        let userEmail = 'unknown';
        let userName = 'there';
        
        try {
          const clerkUser = await clerkClient.users.getUser(user.user_id);
          if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
            userEmail = clerkUser.emailAddresses[0].emailAddress;
          }
          if (clerkUser.firstName) {
            userName = clerkUser.firstName;
          }
        } catch (clerkError) {
          console.warn(`⚠️ Could not fetch Clerk user data for ${user.user_id}:`, clerkError);
        }

        console.log(`🔄 Sending reset notification to user ${userEmail} (${userName})`)

        // Get user's current tasks for the summary
        const { data: userTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.user_id)

        const completedTasks = userTasks?.filter(task => task.completed) || []
        const incompleteTasks = userTasks?.filter(task => !task.completed) || []

        // Send reset notification using Firebase
        try {
          const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send-firebase`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.user_id,
              notification: {
                title: '🌅 Daily Reset Complete!',
                body: `Your 24-hour cycle has finished. You completed ${completedTasks.length} tasks!`,
                data: {
                  type: 'daily_reset',
                  taskSummary: {
                    total: userTasks.length,
                    completed_count: completedTasks.length,
                    not_completed_count: incompleteTasks.length,
                    completed: completedTasks.map(t => t.title),
                    not_completed: incompleteTasks.map(t => t.title)
                  }
                }
              }
            })
          });

          if (notificationResponse.ok) {
            notificationsSent++;
            console.log(`✅ Reset notification sent successfully to user ${user.user_id.slice(-8)}`);
            
            // Now trigger the actual daily reset for this user
            try {
              const resetResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/daily-reset`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user.user_id }),
              });

              if (resetResponse.ok) {
                console.log(`✅ Daily reset completed for user ${user.user_id.slice(-8)}`);
              } else {
                console.error(`❌ Failed to reset user ${user.user_id.slice(-8)}:`, await resetResponse.text());
              }
            } catch (resetError) {
              console.error(`❌ Error triggering reset for user ${user.user_id.slice(-8)}:`, resetError);
            }
          } else {
            errors++;
            console.error(`❌ Failed to send reset notification to user ${user.user_id.slice(-8)}:`, await notificationResponse.text());
          }
        } catch (notificationError) {
          errors++;
          console.error(`❌ Error sending reset notification to user ${user.user_id.slice(-8)}:`, notificationError);
        }

      } catch (error) {
        errors++
        console.error(`❌ Error processing reset notification for user ${user.user_id}:`, error)
      }
    }

    // Handle new users who need their first reset
    for (const user of newUsersNeedingFirstReset) {
      try {
        // Get user's actual email from Clerk
        let userEmail = user.userId; // Fallback to userId
        let userName = 'there';
        
        try {
          const clerkUser = await clerkClient.users.getUser(user.user_id);
          if (clerkUser.emailAddresses && clerkUser.emailAddresses.length > 0) {
            userEmail = clerkUser.emailAddresses[0].emailAddress;
          }
          if (clerkUser.firstName) {
            userName = clerkUser.firstName;
          }
        } catch (clerkError) {
          console.warn(`⚠️ Could not fetch Clerk user data for ${user.user_id}:`, clerkError);
          continue;
        }

        console.log(`🆕 Sending first reset notification to new user ${userEmail}`)

        // Get user's current tasks for the summary
        const { data: userTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.user_id)

        const completedTasks = userTasks?.filter(task => task.completed) || []
        const incompleteTasks = userTasks?.filter(task => !task.completed) || []

        // Send first reset notification via Firebase
        try {
          const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send-firebase`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.user_id,
              notification: {
                title: '🚀 Welcome to Your First Reset!',
                body: 'You\'ve been using Teyra for 24+ hours. Time for your first daily reset!',
                data: {
                  type: 'first_daily_reset',
                  taskSummary: {
                    total: userTasks.length,
                    completed_count: completedTasks.length,
                    not_completed_count: incompleteTasks.length,
                    completed: completedTasks.map(t => t.title),
                    not_completed: incompleteTasks.map(t => t.title)
                  }
                }
              }
            })
          });

          if (notificationResponse.ok) {
            notificationsSent++;
            console.log(`✅ First reset notification sent to user ${user.user_id.slice(-8)}`);
            
            // Trigger the first reset
            try {
              const resetResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/daily-reset`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  userId: user.user_id,
                  isFirstReset: true
                }),
              });

              if (resetResponse.ok) {
                console.log(`✅ First daily reset completed for user ${user.user_id.slice(-8)}`);
              } else {
                console.error(`❌ Failed to complete first reset for user ${user.user_id.slice(-8)}:`, await resetResponse.text());
              }
            } catch (resetError) {
              console.error(`❌ Error triggering first reset for user ${user.user_id.slice(-8)}:`, resetError);
            }
          } else {
            errors++;
            console.error(`❌ Failed to send first reset notification to user ${user.user_id.slice(-8)}:`, await notificationResponse.text());
          }
        } catch (notificationError) {
          errors++;
          console.error(`❌ Error sending first reset notification to user ${user.user_id.slice(-8)}:`, notificationError);
        }

      } catch (error) {
        errors++
        console.error(`❌ Error processing first reset notification for user ${user.user_id}:`, error)
      }
    }

    console.log(`🎯 Cron job completed successfully!`)
    console.log(`📊 Final stats: ${notificationsSent} notifications sent, ${errors} errors`)
    console.log(`⏰ Next cron check in 6 hours`)

    return NextResponse.json({
      success: true,
      message: 'Daily notifications cron job completed successfully',
      stats: {
        notificationsSent,
        errors,
        totalUsers: allUsers.length,
        inactiveUsers: inactiveUsers.length,
        usersNeedingReset: usersNeedingReset.length,
        newUsersNeedingFirstReset: newUsersNeedingFirstReset.length,
        timestamp: now.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Daily notifications cron job error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 