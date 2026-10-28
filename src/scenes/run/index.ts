import type { SceneModel } from '@graphlearning/graphl-flow'
import { runApp } from './app'
import { runTests } from './tests'
import { runCompute } from './compute'
import { runImage } from './image'
import { runTask } from './task'
import { runService } from './service'
import { runScaling } from './scaling'
import { runGraceful } from './graceful'
import { runEc2 } from './ec2'

export const runScenes: Record<string, SceneModel> = {
  'run-app': runApp,
  'run-tests': runTests,
  'run-compute': runCompute,
  'run-image': runImage,
  'run-task': runTask,
  'run-service': runService,
  'run-scaling': runScaling,
  'run-graceful': runGraceful,
  'run-ec2': runEc2,
}
