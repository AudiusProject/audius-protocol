import React from 'react';
import { Flex } from '@audius/harmony-native';
import Skeleton from '../skeleton';
export var CommentSkeleton = function () {
    return (<Flex direction='row' gap='s' alignItems='center' p='l'>
      <Skeleton width={40} height={40} style={{ borderRadius: 100 }}/>
      <Flex gap='s'>
        <Skeleton height={20} width={240}/>
        <Skeleton height={20} width={160}/>
      </Flex>
    </Flex>);
};
