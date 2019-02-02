import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Button, Card, Icon, Header } from 'semantic-ui-react'

import PageRankForm from './Centralities/PageRankForm'
import BetweennesForm from './Centralities/BetweennesForm'
import ApproxBetweennessForm from './Centralities/ApproxBetweennessForm'
import ClosenessCentralityForm from './Centralities/ClosenessCentralityForm'
import HarmonicCentralityForm from './Centralities/HarmonicCentralityForm'
import { pageRank, articleRank, betweenness, approxBetweenness, closeness, harmonic } from "../services/centralities"
import { loadLabels, loadRelationshipTypes } from "../services/metadata"

import { v4 as generateTaskId } from 'uuid'
import { addTask, completeTask } from "../ducks/tasks"
import { getAlgorithmDefinitions } from "./algorithmsLibrary"
import { getCurrentAlgorithm } from "../ducks/algorithms"

class Algorithms extends Component {
  state = {
    collapsed: false,
    parameters: {}
  }

  componentDidMount() {
    loadLabels().then(result => {
      const labels = result.rows.map(row => {
        return { key: row.label, value: row.label, text: row.label }
      })
      labels.unshift({ key: null, value: null, text: 'Any' })
      this.setState({
        labelOptions: labels,
      })
    })

    loadRelationshipTypes().then(result => {
      const relationshipTypes = result.rows.map(row => {
        return { key: row.label, value: row.label, text: row.label }
      })
      relationshipTypes.unshift({ key: null, value: null, text: 'Any' })
      this.setState({
        relationshipTypeOptions: relationshipTypes
      })
    })

    const { activeGroup, activeAlgorithm } = this.props
    const { parameters } = getAlgorithmDefinitions(activeGroup, activeAlgorithm)
    this.setState({ parameters })

  }

  onChangeParam(key, value) {
    const parameters = { ...this.state.parameters }
    parameters[key] = value
    this.setState({
      parameters
    })
  }

  onRunAlgo() {
    const taskId = generateTaskId()

    const { service } = this.props.currentAlgorithm
    const { activeGroup, activeAlgorithm } = this.props

    if (service) {
      service({
        taskId,
        ...this.state.parameters
      }).then(result => {
        console.log(result)
        this.props.completeTask(taskId, result)
        this.setState({ collapsed: true })
      })

      this.props.addTask(taskId, activeGroup, activeAlgorithm, { ...this.state.parameters })
    }
  }

  toggleCollapse() {
    this.setState(({ collapsed }) => ({ collapsed: !collapsed }))
  }

  render() {
    const { Form, description } = this.props.currentAlgorithm

    const containerStyle = {
      width: '96%',
      overflow: 'hidden'
    }

    let toggleIcon = 'angle double up'

    if (this.state.collapsed) {
      // containerStyle.height = '15em';
      toggleIcon = 'angle double down'
    }

    return (
      <div style={containerStyle}>
        <Card>
          <Card.Content>
            <Icon name='sitemap'/>
            <Card.Header>
              {this.props.activeAlgorithm}
            </Card.Header>
            <Card.Meta>{description}
            </Card.Meta>
          </Card.Content>
          <Card.Content extra>
            <div>
              <Form {...this.state.parameters} labelOptions={this.state.labelOptions}
                    relationshipTypeOptions={this.state.relationshipTypeOptions}
                    onChange={this.onChangeParam.bind(this)}/>
            </div>
            <div className='ui two buttons'>
              <Button basic color='green' onClick={this.onRunAlgo.bind(this)}>
                Run
              </Button>
              <Button basic color='red'>
                Cancel
              </Button>
            </div>
          </Card.Content>
        </Card>
        {/* <div style={{ width: '100%', textAlign: 'center', paddingTop: '1em' }}>
          <Button icon size='mini' onClick={this.toggleCollapse.bind(this)}>
            <Icon name={toggleIcon}/>
          </Button>
        </div>*/}

      </div>
    )
  }
}

const mapStateToProps = state => ({
  activeGroup: state.algorithms.group,
  activeAlgorithm: state.algorithms.algorithm,
  currentAlgorithm: getCurrentAlgorithm(state)
})

const mapDispatchToProps = dispatch => ({
  addTask: (taskId, group, algorithm, parameters) => {
    const task = {
      group,
      algorithm,
      taskId,
      parameters,
      startTime: new Date()
    }
    dispatch(addTask({ ...task }))
  },
  completeTask: (taskId, result) => {
    dispatch(completeTask({ taskId, result }))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(Algorithms)