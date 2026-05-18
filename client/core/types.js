/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} memberId
 * @property {string} username
 * @property {string} email
 * @property {string} passwordHash
 * @property {"active"|"pending"|"disabled"|"rejected"} status
 * @property {string} createdAt
 * @property {string|null} lastLoginAt
 * @property {string} [name]
 * @property {string} [identity]
 * @property {string} [role]
 * @property {string[]} [departments]
 * @property {string[]} [directions]
 * @property {string[]} [robotGroups]
 * @property {string[]} [positions]
 * @property {string[]} [skillTags]
 * @property {string} [bio]
 * @property {boolean} [hiddenFromDirectory]
 */

/**
 * @typedef {Object} Member
 * @property {string} id
 * @property {string} userId
 * @property {string} name
 * @property {string} avatar
 * @property {string} phone
 * @property {string} identity
 * @property {string} role
 * @property {string[]} departments
 * @property {string[]} directions
 * @property {string[]} robotGroups
 * @property {string[]} positions
 * @property {string[]} skillTags
 * @property {string} joinDate
 * @property {string} memberStatus
 * @property {string} bio
 * @property {boolean} [hiddenFromDirectory]
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} type
 * @property {string} status
 * @property {string} priority
 * @property {string} difficulty
 * @property {string} ownerId
 * @property {string} creatorId
 * @property {string} department
 * @property {string} [direction]
 * @property {string} [robotGroup]
 * @property {string} dueAt
 * @property {number} studyPoints
 * @property {number} laborPoints
 * @property {number} managementPoints
 * @property {number} maxParticipants
 * @property {boolean} approvalRequired
 * @property {string} recommendedFor
 * @property {number} progressPercent
 * @property {boolean} publicToMarket
 * @property {string[]} [tags]
 * @property {string} [acceptanceCriteria]
 * @property {string} createdAt
 * @property {string|null} submittedAt
 * @property {string|null} completedAt
 * @property {Object[]} [attachments]
 * @property {Object[]} [comments]
 * @property {Object[]} [progressNodes]
 */

/**
 * @typedef {Object} TaskParticipant
 * @property {string} id
 * @property {string} taskId
 * @property {string} memberId
 * @property {string} role
 * @property {"initial"|"middle"} joinType
 * @property {"involved"|"exited"|"completed"} status
 * @property {string} joinedAt
 * @property {string|null} exitedAt
 * @property {number} contributionRatio
 */

/**
 * @typedef {Object} Approval
 * @property {string} id
 * @property {"registration"|"join"|"completion"|"settlement"|"compensation"|"promotion"|"status_change"} type
 * @property {string} targetId
 * @property {string} submitterId
 * @property {string|null} approverId
 * @property {"pending"|"approved"|"rejected"|"returned"} status
 * @property {string} comment
 * @property {string} createdAt
 * @property {string|null} reviewedAt
 * @property {string} [requestedIdentity]
 * @property {Object[]} [attachments]
 * @property {boolean} [reviewAttachmentsBound]
 */

/**
 * @typedef {Object} PointTransaction
 * @property {string} id
 * @property {string} memberId
 * @property {string} [taskId]
 * @property {"study"|"labor"|"management"|"compensation"} type
 * @property {number} amount
 * @property {string} reason
 * @property {string} operatorId
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {string} userId
 * @property {string} text
 * @property {string} sourceId
 * @property {string} sourceType
 * @property {string} [taskId]
 * @property {string} [memberId]
 * @property {string} type
 * @property {boolean} read
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Database
 * @property {number} version
 * @property {User[]} users
 * @property {Member[]} members
 * @property {Task[]} tasks
 * @property {TaskParticipant[]} taskParticipants
 * @property {Approval[]} approvals
 * @property {PointTransaction[]} pointTransactions
 * @property {Notification[]} notifications
 * @property {Object[]} robotProjects
 * @property {Object} settings
 */

export {};
