# Tamper proof data implementation

## 1. How does the client ensure that their data has not been tampered with?
The idea that I came up with is too use hashing as a way to veryfy if the data has been maliciously change. Specifically,
everytime when user tries to update the data, they must also provide a custom secret salt, which will be used by the server combined with the hashing algorithm, to generate the hash of updated data, and the database will store both the value and hashed value, so that later on the user may provide the same salt to verify the integrity of the data. Since the hacker does not know the user's salt, they cannot get away with tampering the data without causing the hash to mismatch. The may drawback of this method is that user must remember the salt and use the same one everytime, and the security is as strong as the strenth of user provided salt.


## 2. If the data has been tampered with, how can the client recover the lost data?
The main mechanism to recover the data after it got tampered, is to use an append only logger. This logger will record every transaction, and will not allow modify or delete the already writen data. So hacker cannot delete old data to cover up the data tampering attempt. User can then provide the salt, and the server will try to find the last know data where the value of the data matches the salted hash based on the salt user provide. After finding it, it will finally reload the data back to the database, recovering the lost data. 

