/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

import React, { memo } from 'react';
import { Button, Flex, Padded } from '@buffetjs/core';
import Container from './container';
import doodle from './MessyDoodle.png';
import styled from 'styled-components';
import { request } from 'strapi-helper-plugin';

const downloadJson = (data, name) => {
  let filename = name;
  let contentType = 'application/json;charset=utf-8;';
  let a = document.createElement('a');
  a.download = filename;
  a.href = 'data:' + contentType + ',' + encodeURIComponent(JSON.stringify(data, undefined, '  '));
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const HomePage = () => {
  const downloadReport = async (name) => {
    downloadJson(await request(`/reports/${name}`), `${name}.json`);
  };

  return (
    <Wrapper>
      <Padded top bottom>
        <Image src={doodle}/>
      </Padded>
      <Container>
        <Padded bottom top left right>
          <Button classList="m-5" label="Download User Report" color="primary" onClick={() => downloadReport('users')}/>
        </Padded>
        <Padded bottom top left right>
          <Button classList="m-5" label="Download Committee Report" color="primary" onClick={() => downloadReport('committees')}/>
        </Padded>
      </Container>
    </Wrapper>
  );
};

export default memo(HomePage);

const Image = styled.img`
  width: 440px;
  margin: auto;
`;
const Wrapper = styled.div`
  min-height: calc(100vh - 6rem);
  width: calc(100vw - 24rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
