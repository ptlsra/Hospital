# Hospital


# How to run Hospital API in a multi node environment?.

## Prerequisites

> Claims network up and running.

> Start broker API (https://mphasisblockchain@bitbucket.org/blockchainmphasisteam/broker.git)

> Mongodb

> IPFS at mbroker (port 5001 exposed)


## Clone hospital repository

```
$ git clone https://mphasisblockchain@bitbucket.org/blockchainmphasisteam/hospital.git
```

## Setup

```
$ cd hospital

```

> NOTE : give ip address of mbroker as parameter to initHospitalMultiNode.sh.


```
$ ./initHospitalMultiNode.sh $mbrokerIpAddress
```


## Start the API

```
$ node app.js
```